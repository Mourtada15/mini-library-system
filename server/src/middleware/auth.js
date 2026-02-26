function getTestUserFromHeader(req) {
  if (process.env.NODE_ENV === 'test') {
    const role = req.header('x-test-user-role');
    if (role) {
      return {
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role,
      };
    }
  }
  return null;
}

function requireAuth(req, res, next) {
  const testUser = getTestUserFromHeader(req);
  if (testUser) {
    req.user = testUser;
    return next();
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if (req.user) {
    return next();
  }

  return res.status(401).json({ message: 'Authentication required' });
}

function requireRole(...roles) {
  return (req, res, next) => {
    const testUser = getTestUserFromHeader(req);
    if (testUser) {
      req.user = testUser;
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };

