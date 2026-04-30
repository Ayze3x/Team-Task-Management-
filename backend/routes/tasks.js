const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /tasks - List tasks (with filters)
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { project_id, status, assigned_to, overdue } = req.query;
    let sql = `SELECT t.*, u.name as assignee_name, p.title as project_title
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id WHERE 1=1`;
    const params = [];

    if (project_id) { sql += ' AND t.project_id = ?'; params.push(project_id); }
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (assigned_to) { sql += ' AND t.assigned_to = ?'; params.push(assigned_to); }
    if (overdue === 'true') { sql += " AND t.due_date < datetime('now') AND t.status != 'completed'"; }

    // Members only see tasks in their projects or assigned to them
    if (req.user.role !== 'admin') {
      sql += ` AND (t.assigned_to = ? OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?))`;
      params.push(req.user.id, req.user.id);
    }

    sql += ' ORDER BY t.created_at DESC';
    const tasks = db.prepare(sql).all(...params);
    res.json({ tasks });
  } catch (error) {
    console.error('[TASKS] List error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tasks/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare(`SELECT t.*, u.name as assignee_name, p.title as project_title
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?`).get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /tasks
router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;
    if (!title || title.trim().length < 2) return res.status(400).json({ error: 'Title required' });
    if (!project_id) return res.status(400).json({ error: 'Project ID required' });

    const db = getDb();
    // Members can only create tasks in their projects
    if (req.user.role !== 'admin') {
      const membership = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, req.user.id);
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assigned_to, created_by) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, title.trim(), description?.trim() || '', status || 'todo', priority || 'medium', due_date || null, project_id, assigned_to || null, req.user.id);

    db.prepare('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?,?,?,?,?,?)')
      .run(uuidv4(), req.user.id, 'created', 'task', id, `Created task "${title}"`);

    const task = db.prepare('SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?').get(id);
    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    console.error('[TASKS] Create error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /tasks/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Members can only update own tasks
    if (req.user.role !== 'admin' && existing.created_by !== req.user.id && existing.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Can only update your own tasks' });
    }

    const { title, description, status, priority, due_date, assigned_to } = req.body;
    db.prepare(`UPDATE tasks SET title=COALESCE(?,title), description=COALESCE(?,description),
      status=COALESCE(?,status), priority=COALESCE(?,priority), due_date=COALESCE(?,due_date),
      assigned_to=COALESCE(?,assigned_to), updated_at=datetime('now') WHERE id=?`)
      .run(title?.trim(), description?.trim(), status, priority, due_date, assigned_to, req.params.id);

    const task = db.prepare('SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?').get(req.params.id);
    res.json({ message: 'Updated', task });
  } catch (error) {
    console.error('[TASKS] Update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
