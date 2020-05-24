const express = require('express');
const openpgp = require('openpgp');

const otherBankMiddleware = require('./other-banks.middlewares');

const router = express.Router();
const checkValidity = otherBankMiddleware.checkValidity;

router.post('/query-account-information', checkValidity, async (req, res) => {
    res.send('APP IS RUNNING');
});

router.post('/payment-on-account', async (req, res) => {
    res.send('APP IS RUNNING');
});

module.exports = router;