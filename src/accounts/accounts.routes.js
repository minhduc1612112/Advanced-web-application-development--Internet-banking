const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const accountController = require('./accounts.controllers');

router.post('/change-password', isAuth, accountController.changePassword);

module.exports = router;