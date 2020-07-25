const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const transactionController = require('./transactions.controllers');

router.post('/send-otp', isAuth, transactionController.sendOTP);
router.post('/internal-bank', isAuth, transactionController.internalBankTransaction);

router.get('/interbank/accountNumber/:accountNumber', isAuth, transactionController.getInterbankAccount);
router.post('/interbank', isAuth, transactionController.interbankTransaction);

router.get('/money-receiving',isAuth, transactionController.moneyReceivingTransaction);
router.get('/money-sending',isAuth, transactionController.moneySendingTransaction);
router.get('/payment-debt-reminders',isAuth, transactionController.paymentDebtReminders);

module.exports = router;