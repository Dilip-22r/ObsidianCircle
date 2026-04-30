module.exports = function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.status === 'pending') {
    return res.status(403).json({ error: 'Account pending admin approval' });
  }

  next();
};
