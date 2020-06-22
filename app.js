require('express-async-errors');
const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const indexRouter = require('./src/home/home.routes');
const otherbankRouter = require('./src/other-banks/other-banks.routes');
const userRouter = require('./src/users/users.routes');
const transferRouter = require('./src/transfer/transfer.routes');
const authRouter = require('./src/auth/auth.routes');

const userModel = require('./src/users/users.models');

//Authentication with jwt
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.ACCESS_TOKEN_SECRET || 'access-token-secret-example';
passport.use('jwt', new JwtStrategy(opts, async function (jwt_payload, done) {
  const user = await userModel.getUser(jwt_payload.payload.username);
  if (!user) {
    return done(null, false);
  }
  return done(null, user);
}));
//==================================================

const app = express();

// ========== Configure CORS ==========
app.use(cors({
  credentials: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token", "Authorization"],
  methods: "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"
}));
// ====================================

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.use('/', indexRouter);
app.use('/other-banks', otherbankRouter);
app.use('/users', userRouter);
app.use('/transfer', transferRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(err.status || 500).send(err.message);
});

module.exports = app;