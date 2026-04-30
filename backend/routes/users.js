const express = require('express');
const { getDb } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const router = express.Router();

// GET /users - List all users (for member assignment)
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users ORDER BY name ASC').all();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/stats - Dashboard stats for current user
router.get('/stats', authenticate, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const myTasks = db.prepare(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status='in-progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks WHERE assigned_to = ?`).get(userId);

    let projectCount;
    if (isAdmin) {
      projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
    } else {
      projectCount = db.prepare('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?').get(userId);
    }

    const totalUsers = isAdmin ? db.prepare('SELECT COUNT(*) as count FROM users').get() : { count: 0 };

    // Chart data: task completion over last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayData = db.prepare(`SELECT
        DATE(datetime('now', '-${i} days')) as date,
        SUM(CASE WHEN status='completed' AND DATE(updated_at) = DATE(datetime('now', '-${i} days')) THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN DATE(created_at) = DATE(datetime('now', '-${i} days')) THEN 1 ELSE 0 END) as created
        FROM tasks`).get();
      days.push({ date: dayData.date, completed: dayData.completed || 0, created: dayData.created || 0 });
    }

    // Per-user productivity
    const userProductivity = db.prepare(`SELECT u.id, u.name, u.role, u.avatar,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status='completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM users u LEFT JOIN tasks t ON t.assigned_to = u.id
      GROUP BY u.id ORDER BY completed_tasks DESC LIMIT 10`).all();

    // All tasks grouped by status for pie chart
    const allTaskStats = isAdmin
      ? db.prepare(`SELECT COUNT(*) as total,
          SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status='in-progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN due_date < datetime('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
          FROM tasks`).get()
      : myTasks;

    // Upcoming tasks (next 7 days)
    const upcomingTasks = db.prepare(`SELECT t.*, u.name as assignee_name, p.title as project_title
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date BETWEEN datetime('now') AND datetime('now', '+7 days') AND t.status != 'completed'
      ORDER BY t.due_date ASC LIMIT 5`).all();

    const recentActivity = db.prepare(`SELECT al.*, u.name as user_name FROM activity_log al
      JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 20`).all();

    res.json({
      stats: {
        tasks: myTasks,
        allTasks: allTaskStats,
        projects: projectCount.count,
        users: totalUsers.count,
        chartData: days,
        userProductivity,
        upcomingTasks,
        recentActivity
      }
    });
  } catch (error) {
    console.error('[USERS] Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/calendar - Tasks for calendar view
router.get('/calendar', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

    let sql = `SELECT t.id, t.title, t.status, t.priority, t.due_date, u.name as assignee_name, p.title as project_title
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date BETWEEN ? AND ?`;
    const params = [startDate, endDate];

    if (req.user.role !== 'admin') {
      sql += ` AND (t.assigned_to = ? OR t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?))`;
      params.push(req.user.id, req.user.id);
    }
    sql += ' ORDER BY t.due_date ASC';
    const tasks = db.prepare(sql).all(...params);
    res.json({ tasks });
  } catch (error) {
    console.error('[USERS] Calendar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
