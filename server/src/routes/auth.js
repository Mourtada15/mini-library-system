const express = require('express');
const passport = require('passport');

const router = express.Router();

const clientOrigin = process.env.CLIENT_ORIGIN;

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: clientOrigin ? `${clientOrigin}/login` : '/login',
    session: true,
  }),
  (req, res) => {
    if (!process.env.CLIENT_ORIGIN) {
      return res.redirect('/books');
    }
    return res.redirect(`${process.env.CLIENT_ORIGIN}/books`);
  }
);

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
