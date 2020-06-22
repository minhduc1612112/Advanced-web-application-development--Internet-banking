const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const userController = require('./users.controllers');

router.get('/', isAuth, userController.getProfile);

module.exports = router;