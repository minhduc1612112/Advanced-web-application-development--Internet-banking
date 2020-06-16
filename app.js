require('express-async-errors');
const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const cors = require('cors');

const indexRouter = require('./src/home/home.routes');
const otherbankRouter = require('./src/other-banks/other-banks.routes');
const userRouter = require('./src/users/users.routes');
const transferRouter = require('./src/transfer/transfer.routes');

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