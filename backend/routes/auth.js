const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /auth/signup
router.post('/signup', validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 }
}), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('[AUTH] Signup attempt for:', email);
    
    const db = getDb();

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)
    `).run(userId, name.trim(), email.toLowerCase().trim(), hashedPassword, 'member');

    // Generate JWT
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(userId);

    console.log('[AUTH] Signup successful for:', email);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });
  } catch (error) {
    console.error('[AUTH] Signup error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during signup'
    });
  }
});

// POST /auth/login
router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 }
}), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt for:', email);

    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email address'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[AUTH] Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
});

// GET /auth/me - Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /auth/profile - Update profile
router.put('/profile', authenticate, validate({
  name: { required: false, type: 'string', minLength: 2, maxLength: 100 }
}), (req, res) => {
  try {
    const { name } = req.body;
    const db = getDb();

    if (name) {
      db.prepare('UPDATE users SET name = ?, updated_at = datetime("now") WHERE id = ?')
        .run(name.trim(), req.user.id);
    }

    const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('[AUTH] Profile update error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update profile' });
  }
});

// PUT /auth/password - Change password
router.put('/password', authenticate, validate({
  currentPassword: { required: true, type: 'string', minLength: 6 },
  newPassword: { required: true, type: 'string', minLength: 6, maxLength: 128 }
}), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid password', message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?')
      .run(hashed, req.user.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[AUTH] Password change error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to change password' });
  }
});

module.exports = router;
