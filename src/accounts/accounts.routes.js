const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const accountController = require('./accounts.controllers');

router.get('/', isAuth, accountController.getProfile);

module.exports = router;