const express = require('express');
const router = express.Router();
const userController = require('./users.controllers');
const db = require('../../config/dbs');
const collection = 'users';

/* GET home page. */
router.get('/', async function (req, res, next) {
    const b = await db.all(collection);
    res.send(b)
});

module.exports = router;