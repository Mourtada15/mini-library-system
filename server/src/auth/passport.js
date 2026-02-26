const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport(passport) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    // eslint-disable-next-line no-console
    console.warn('Google OAuth env vars are not fully set. Auth will not work properly.');
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID || 'missing',
        clientSecret: GOOGLE_CLIENT_SECRET || 'missing',
        callbackURL: GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
          const googleId = profile.id;
          const name = profile.displayName || (profile.name && profile.name.givenName) || 'User';
          const avatarUrl =
            (profile.photos && profile.photos[0] && profile.photos[0].value) || null;

          if (!email) {
            return done(null, false, { message: 'Email is required from Google profile' });
          }

          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (!user) {
            user = await User.create({
              googleId,
              email,
              name,
              avatarUrl,
              role: 'MEMBER',
            });
          } else {
            const update = {};
            if (!user.googleId) update.googleId = googleId;
            if (user.name !== name) update.name = name;
            if (avatarUrl && user.avatarUrl !== avatarUrl) update.avatarUrl = avatarUrl;
            if (Object.keys(update).length > 0) {
              user.set(update);
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = { configurePassport };

