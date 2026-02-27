const express = require('express');
const session = require('express-session');
const ConnectMongo = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { configurePassport } = require('./auth/passport');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const aiRoutes = require('./routes/ai');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const sessionSecret = process.env.SESSION_SECRET || 'dev_secret_change_me';
const mongoUrl = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    ...(mongoUrl
      ? {
          store: (ConnectMongo.create
            ? ConnectMongo.create({ mongoUrl })
            : ConnectMongo.default.create({ mongoUrl })),
        }
      : {}),
  })
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    return rateLimit.ipKeyGenerator(req, res);
  },
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.use(errorHandler);

module.exports = app;

