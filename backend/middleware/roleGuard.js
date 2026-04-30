/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'member')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Check if user is project admin
 */
function requireProjectAdmin(req, res, next) {
  const { getDb } = require('../config/db');
  const db = getDb();
  
  const projectId = req.params.projectId || req.params.id;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  // System admins can always access
  if (req.user.role === 'admin') {
    return next();
  }

  const membership = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'You must be a project admin to perform this action'
    });
  }

  next();
}

module.exports = { requireRole, requireProjectAdmin };
