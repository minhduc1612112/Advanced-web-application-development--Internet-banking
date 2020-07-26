const express = require('express');
const router = express.Router();

const employeeController = require('./employees.controllers');

router.get('/accounts', employeeController.getAccounts);
router.get('/accounts/:accountNumber', employeeController.getAccount);
router.post('/accounts', employeeController.createAccount);
router.post('/recharge-into-account', employeeController.rechargeIntoAccount);

router.get('/transactions/money-receiving/:accountNumber', employeeController.moneyReceivingTransaction);
router.get('/transactions/money-sending/:accountNumber', employeeController.moneySendingTransaction);
router.get('/transactions/payment-debt-reminders/:accountNumber', employeeController.paymentDebtReminders);

module.exports = router;