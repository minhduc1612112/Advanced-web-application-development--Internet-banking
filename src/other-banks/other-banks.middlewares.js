const openpgp = require('openpgp');

const key = require('../../variables/keys');

const commonMethod = require('../common/common.methods');

exports.checkValidity = async (req, res, next) => {
    const secretPhrase = req.headers.x_secret_phrase;
    if (secretPhrase !== key.secretPhrase) {
        return res.status(400).send('Ngân hàng bạn gọi đến chưa được liên kết.');
    }

    const data = {
        iat: req.body.iat,
        accountNumber: req.body.accountNumber
    }

    const dataHash = req.headers.x_data_hash;
    const dataFromDataHash = await commonMethod.decodeToken(dataHash);
    if (data.iat !== dataFromDataHash.payload.iat || data.accountNumber !== dataFromDataHash.payload.accountNumber) {
        return res.status.send('Lời gọi API này là thông tin cũ đã quá hạn');
    }

    next();
}