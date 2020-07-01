const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const accountController = require('./accounts.controllers');

router.post('/change-password', isAuth, accountController.changePassword);
router.post('/send-confirmative-code', accountController.sendConfirmativeCode);
router.post('/reset-password', accountController.resetPassword);
router.get('/:accountNumber', isAuth, accountController.getAccount);

module.exports = router;