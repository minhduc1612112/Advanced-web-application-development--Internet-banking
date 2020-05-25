const express = require('express');
const openpgp = require('openpgp');

const commonMethod = require('../common/common.methods');
const otherBankMethod = require('./other-banks.methods');

const key = require('../../variables/keys');

const router = express.Router();

router.post('/query-account-information', async (req, res) => {
    const data = req.headers.x_data;
    const decodedData = await commonMethod.verifyToken(data, key.secretString);
    if (!decodedData) {
        return res.status(400).send('Ngân hàng gọi đến chưa được liên kết với ngân hàng này.');
    }

    res.send('APP IS RUNNING');
});

router.post('/payment-on-account', async (req, res) => {
    res.send('APP IS RUNNING');
});

// Hàm để tạo các data tạm thời
const generateKey = async () => {
    const dataToken = await commonMethod.generateToken({
        accountNumber: '123456789'
    }, key.secretString, '365d');
    console.log('secretPhraseToken: ' + dataToken);
}
generateKey();

module.exports = router;