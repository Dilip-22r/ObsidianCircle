module.exports = function requireMentor(req, res, next) {
  if (!req.user || !['alumni', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Mentor privileges required' });
  }
  next();
};
