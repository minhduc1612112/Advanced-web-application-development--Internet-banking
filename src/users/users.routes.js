const express = require('express');
const router = express.Router();
const userController = require('./users.controllers');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.send('APP IS RUNNING');
});

module.exports = router;