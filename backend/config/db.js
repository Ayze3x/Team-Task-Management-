const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'taskforge.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      due_date TEXT,
      project_id TEXT NOT NULL,
      assigned_to TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed admin user if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminId = uuidv4();
    const memberId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)
    `).run(adminId, 'Admin User', 'admin@taskforge.com', hashedPassword, 'admin');

    const memberPassword = bcrypt.hashSync('member123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)
    `).run(memberId, 'John Member', 'john@taskforge.com', memberPassword, 'member');

    // Seed a demo project
    const projectId = uuidv4();
    db.prepare(`
      INSERT INTO projects (id, title, description, deadline, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, 'TaskForge Launch', 'Our flagship project management tool launch', '2026-06-01', adminId);

    // Add members to project
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, adminId, 'admin');
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, memberId, 'member');

    // Seed tasks
    const tasks = [
      { title: 'Design System Setup', status: 'completed', priority: 'high', assigned: adminId },
      { title: 'Authentication Flow', status: 'completed', priority: 'high', assigned: adminId },
      { title: 'Dashboard Analytics', status: 'in-progress', priority: 'medium', assigned: memberId },
      { title: 'Task Board UI', status: 'in-progress', priority: 'medium', assigned: memberId },
      { title: 'API Documentation', status: 'todo', priority: 'low', assigned: memberId },
      { title: 'Performance Optimization', status: 'todo', priority: 'high', assigned: adminId },
    ];

    tasks.forEach(task => {
      db.prepare(`
        INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), task.title, `Work on ${task.title.toLowerCase()}`, task.status, task.priority, '2026-05-15', projectId, task.assigned, adminId);
    });

    console.log('✅ Database seeded with demo data');
    console.log('   Admin: admin@taskforge.com / admin123');
    console.log('   Member: john@taskforge.com / member123');
  }
}

module.exports = { getDb };
