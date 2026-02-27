const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport(passport) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    CLIENT_ORIGIN,
  } = process.env;

  const normalizedClientOrigin = CLIENT_ORIGIN
    ? CLIENT_ORIGIN.replace(/\/+$/, '')
    : '';
  const productionCallbackURL = normalizedClientOrigin
    ? `${normalizedClientOrigin}/api/auth/google/callback`
    : null;
  const clientOriginIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    normalizedClientOrigin
  );
  const callbackURL =
    (!clientOriginIsLocalhost && productionCallbackURL) ||
    GOOGLE_CALLBACK_URL ||
    productionCallbackURL ||
    '/api/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth env vars are not fully set. Auth will not work properly.');
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID || 'missing',
        clientSecret: GOOGLE_CLIENT_SECRET || 'missing',
        callbackURL,
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
