require('express-async-errors');
const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const cors = require('cors');

const indexRouter = require('./src/home/home.routes');
const otherbankRouter = require('./src/other-banks/other-banks.routes');
const accountRouter = require('./src/accounts/accounts.routes');
const transactionRouter = require('./src/transactions/transactions.routes');
const authRouter = require('./src/auth/auth.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.use('/', indexRouter);
app.use('/other-banks', otherbankRouter);
app.use('/accounts', accountRouter);
app.use('/transactions', transactionRouter);
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