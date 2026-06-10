const express = require('express');
const passport = require('passport');
const {
  resolveClientUrl,
  resolveOAuthCallbackUrl,
} = require('../auth/origin');

const router = express.Router();

router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    callbackURL: resolveOAuthCallbackUrl(req),
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    callbackURL: resolveOAuthCallbackUrl(req),
    failureRedirect: resolveClientUrl(req, '/login'),
    session: true,
  })(req, res, next);
}, (req, res) => res.redirect(resolveClientUrl(req, '/books')));

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out' });
    });
  });
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id, email, name, avatarUrl, role } = req.user;
  return res.json({ id, email, name, avatarUrl, role });
});

module.exports = router;
