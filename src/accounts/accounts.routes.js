const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const accountController = require('./accounts.controllers');

router.post('/', accountController.createAccount);

router.post('/change-password', isAuth, accountController.changePassword);
router.post('/send-confirmative-code', accountController.sendConfirmativeCode);
router.post('/reset-password', accountController.resetPassword);

router.get('/accountNumber/:accountNumber', isAuth, accountController.getAccount);

router.route('/receivers')
    .get(isAuth, accountController.getReceivers)
    .post(isAuth, accountController.addReceiver)
router.post('/receivers-delete', isAuth, accountController.deleteReceivers);

router.get('/saving-accounts', isAuth, accountController.getSavingAccounts);
router.get('/payment-accounts', isAuth, accountController.getPaymentAccounts);

module.exports = router;