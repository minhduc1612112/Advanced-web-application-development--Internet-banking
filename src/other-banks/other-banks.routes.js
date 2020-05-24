const express = require('express');
const router = express.Router();
const openpgp = require('openpgp');

router.post('/query-account-information', async (req, res, next) => {
    res.send('APP IS RUNNING');
});

router.post('/payment-on-account', async (req, res, next) => {
    res.send('APP IS RUNNING');
});

module.exports = router;