const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const router = express.Router();

// GET /projects - List projects
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    let projects;
    if (req.user.role === 'admin') {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND due_date < datetime('now') AND status != 'completed') as overdue_tasks,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p LEFT JOIN users u ON p.created_by = u.id ORDER BY p.created_at DESC
      `).all();
    } else {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND due_date < datetime('now') AND status != 'completed') as overdue_tasks,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
        FROM projects p LEFT JOIN users u ON p.created_by = u.id
        INNER JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
    }
    res.json({ projects });
  } catch (error) {
    console.error('[PROJECTS] List error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /projects/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const members = db.prepare('SELECT u.id, u.name, u.email, u.role as system_role, pm.role as project_role FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?').all(req.params.id);
    const stats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='in-progress' THEN 1 ELSE 0 END) as in_progress, SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo, SUM(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue FROM tasks WHERE project_id = ?`).get(req.params.id);
    res.json({ project: { ...project, members, stats } });
  } catch (error) {
    console.error('[PROJECTS] Get error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /projects
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    if (!title || title.trim().length < 2) return res.status(400).json({ error: 'Title required (min 2 chars)' });
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO projects (id, title, description, deadline, created_by) VALUES (?,?,?,?,?)').run(id, title.trim(), description?.trim() || '', deadline || null, req.user.id);
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)').run(id, req.user.id, 'admin');
    db.prepare('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?,?,?,?,?,?)').run(uuidv4(), req.user.id, 'created', 'project', id, `Created project "${title}"`);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    console.error('[PROJECTS] Create error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /projects/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, description, deadline, status } = req.body;
    db.prepare('UPDATE projects SET title=COALESCE(?,title), description=COALESCE(?,description), deadline=COALESCE(?,deadline), status=COALESCE(?,status), updated_at=datetime("now") WHERE id=?').run(title?.trim(), description?.trim(), deadline, status, req.params.id);
    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ message: 'Updated', project: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /projects/:id
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const r = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /projects/:id/members
router.post('/:id/members', authenticate, (req, res) => {
  try {
    const db = getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
    if (existing) return res.status(409).json({ error: 'Already a member' });
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)').run(req.params.id, user.id, 'member');
    res.status(201).json({ message: 'Member added', member: user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  try {
    const db = getDb();
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
