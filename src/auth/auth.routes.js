const express = require('express');
const router = express.Router();

const controllerAuth = require('./auth.controllers');

router.post('/login', controllerAuth.login);
router.post('/refresh', controllerAuth.refreshToken);

module.exports = router;