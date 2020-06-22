const express = require('express');
const router = express.Router();

const controllerAuth = require('./auth.controllers');

router.post('/register', controllerAuth.register); //username, password
router.post('/login', controllerAuth.login); //username, password
router.post('/refresh', controllerAuth.refreshToken); // refreshToken

module.exports = router;