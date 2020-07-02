const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const transactionController = require('./transactions.controllers');

router.post('/send-otp', isAuth, transactionController.sendOTP );
router.post('/internal-bank', isAuth, transactionController.internalBankTransaction);

module.exports = router;