const express = require('express');
const openpgp = require('openpgp');

const commonMethod = require('../common/common.methods');
const otherBankMethod = require('./other-banks.methods');

const key = require('../../variables/keys');

const router = express.Router();

const checkValidityPartner = async (xHashedData) => {
    const decodedHashedData = await commonMethod.verifyToken(xHashedData, key.secretString);
    if (!decodedHashedData) {
        return null;
    }
    return decodedHashedData;
}

const checkValidityTime = (decodedHashedData) => {
    const iatNow = commonMethod.getIssuedAtNow();
    const {
        iat
    } = decodedHashedData.payload;
    // if (iatNow - iat > key.validityTime) {
    //     return false;
    // }
    return true;
}

const checkValidityData = async (encryptedData) => {
    const decryptedData = await otherBankMethod.decrypted(encryptedData);
    if (!decryptedData) {
        return null;
    }
    const data = JSON.parse(decryptedData);
    return data;
}

router.post('/query-account-information', async (req, res) => {
    // INPUT
    // const data = {
    //     desAccountNumber: '123456789',
    //     desBankCode,
    //     iat: commonMethod.getIssuedAtNow()
    // }
    // headers: x_hashed_data
    // body: encrypted_data

    const xHashedData = req.headers.x_hashed_data;
    // const encryptedData = req.body.encrypted_data;
    const encryptedData = `-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wcBMA3+LEt36YyzmAQf+Pld39G8LHzNwdmg3weyxIDG8Ap1J5W9YVD/JqF3J
b3rJqCBHyAgvScs/G9dFn83C2UasEX8GfdY9XcjFGv85nF0zNKA9ggyiw1iq
zEocaPGT02hJDPQ+abTVXr0Sk/cjlFTZKZmCcCtK5WNk+hz7rJvsvwNIBnJN
mlbufJKZE5/1tz5pD6JkTuL8oZxlhBrbULtZOCDBX0VLUHl2wft8seyjGmlq
1AqKnu6dySFiS+8gMHnmUOmI2YPjfbN/V4kZzyfT8NcXD2rdMB1dCxfPAc5g
zIysQTPW7HvQoKKvSiCu3iQRkX0kaz9Y9K7q+RSNZqBdZxHwszJzUP/Y6kr2
JtKBAbQ7Cu93XUki3QVsYowurhip3/y6a9lNsVjsPf5aI5hyNKf1hmcJSSm8
LSw4VTerCXfNxA2tlXboaUAUfFKvxGZfaR3ff2wD7s2Ni0am74F8bLp7Uz/M
x5npQs2BbH1PsDzQVxY4TVd7hBL1Bes8Il2l4jRaAgOZX/P9oms4xsjt
=T36u
-----END PGP MESSAGE-----`;

    const decodedHashedData = await checkValidityPartner(xHashedData);
    if (!decodedHashedData) {
        return res.status(401).send({
            status: -1,
            msg: 'Ngân hàng của bạn chưa được liên kết với ngân hàng này.'
        });
    }

    const validityTime = checkValidityTime(decodedHashedData);
    if (!validityTime) {
        return res.status(400).send({
            status: -2,
            msg: 'Lời gọi này là thông tin cũ đã quá hạn.'
        });
    }

    const data = await checkValidityData(encryptedData);
    if (!data) {
        return res.status(400).send({
            status: -3,
            msg: 'Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.'
        });
    }

    // Query data từ database
    // ...

    console.log(data)
    return res.send({
        desAccountNumber: data.desAccountNumber,
        desAccountName: 'Le Minh Duc'
    });
});

router.post('/payment-on-account', async (req, res) => {
    // INPUT
    // headers: x_hashed_data
    // const data = {
    //     srcAccountNumber:'987654321',
    //     srcBankCode,
    //     desAccountNumber: '123456789',
    //     desBankCode,
    //     money,
    //     content,
    //     iat: commonMethod.getIssuedAtNow()
    // }
    // body: encrypted_data, signed_data


    const xHashedData = req.headers.x_hashed_data;

    const decodedHashedData = await checkValidityPartner(xHashedData);
    if (!decodedHashedData) {
        return res.status(401).send({
            status: -1,
            msg: 'Ngân hàng của bạn chưa được liên kết với ngân hàng này.'
        });
    }

    const validityTime = checkValidityTime(decodedHashedData);
    if (!validityTime) {
        return res.status(400).send({
            status: -2,
            msg: 'Lời gọi này là thông tin cũ đã quá hạn.'
        });
    }

    // const encryptedData = req.body.encrypted_data;
    const encryptedData = `-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wcBMA3+LEt36YyzmAQf/R84L0kphIUkYpj8bNwrN39Kga5CGusDj7/nbH/jK
JayDV0oYxRBUMQ/Zi+sXXwXREZBAg46BrjLWxO8tBQqXXA/Q/79BMPNpYhzP
RBBRiNSQkKTHNOseGoDPxZ8CXDl560MKa1wZijoCFqyZtUVAUPQUmazoV2tf
dOajcEeWbYV6fYCsFacKIR6B1UKV3kInJXjXfrlMZUsdmBWFwuHeFQHEGoKB
buHfsoiv3uaJ5iI99DxDkFS7jJ26TimnvhsHzAKaX8v7BkJDmJpFO2tL9aQq
pz7eNQbh3MNOTAWhNRuzZ7WxG5mjC2/DX9oCAa9y030qVxXqPehZtj0uqa66
AdLAIwFu1qMSOBubPPS0UOg/fmlCpQ1YRkwjd520eKMiEfhqEv5pzJ/WH0Tq
ww+3KtviSnGbcdYvSwthjddL9nxkxzhuY8yI2GXxiOTLerSqwr6++79LYt1j
+uYYrd5zxT7IerB01QpNmMUHz/JzCZsQdaHAIImpfgrQQC9edHDZcNnvzxnV
NMeqmbDtgpnD6IDITRURViZ+pKpDPgBjyXt0jA4OnAeprTBJ/6P1/44qL40c
Yw7gA1EkxCMEmYnGBHtBQlLAECsvPjALBdADUxox7RJuDcAeGaKlYxu+MLFW
7LDhgR3M
=T5MV
-----END PGP MESSAGE-----`;

    const data = await checkValidityData(encryptedData);
    if (!data) {
        return res.status(400).send({
            status: -3,
            msg: 'Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.'
        });
    }

    // const signedData = req.body.signed_data;
    const signedData = `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

{"srcAccountNumber":"987654321","srcBankCode":"KL_BANK","desAccountNumber":"123456789","desBankCode":"MD_BANK","money":10000000,"content":"Trả lương","iat":1590518769}
-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wsBcBAEBCgAGBQJezWPxAAoJEIxnrBZcmHDWWJgIALIVhUZ0dOQXU1Q2tTDa
hi+AfZpA6kENJBtX3+kP7cKcZ4+Ob6YLafW3aEJ+cIY+8WZoer9dthnZrd1/
iGNZbwMJdqt6okMYrkRgbcPlLAKvv6M2eTNK9lMEws7wDkcNoElw/KYachaj
0bX5TOIk7iHLdsgaeYJ8k3SkhVdnYhjA7pDd6h0QkAzZkSa2ptjy5GNichK5
zHLM4O6wmQadfiF9sArDz6PbwLa5qh7YnPTJNYo0o9cgqgSXwo7a/3sbdIil
As24qwztyNVdJO9kmy4T60V3e1e7VMmSZosXSrJO5k6Osqey6o5ohFkSdvz/
l00/9sO2O9MXl6AIqpw128E=
=Kt/o
-----END PGP SIGNATURE-----`;
    const verifiedData = await otherBankMethod.verified(signedData);
    if (!verifiedData) {
        return res.status(400).send({
            status: -4,
            msg: 'Chữ kí không hợp lệ.'
        });
    }

    // Thực hiện nạp tiền vào tài khoản đó
    // ...

    const result = {
        ...data,
        status: 200,
        msg: `Giao dịch thành công.`
    }
    const dataForSign = JSON.stringify(result);
    // Tạo chữ kí gửi lại cho B
    const resSignedData = await otherBankMethod.signed(dataForSign);
    if (!resSignedData) {
        return res.status(400).send('Tạo chữ kí không thành công.');
    }

    // Thực hiện thêm thông tin giao dịch vào databas
    // ...

    return res.send({
        signedData: resSignedData,
        msg: 'Giao dịch thành công'
    });
});

// Hàm để tạo các data tạm thời
const generateKey = async () => {
    // const data = {
    //     desAccountNumber: '123456789',
    //     desBankCode: 'MD_BANK',
    //     iat: commonMethod.getIssuedAtNow()
    // }
    const data = {
        srcAccountNumber: '987654321',
        srcBankCode: 'KL_BANK',
        desAccountNumber: '123456789',
        desBankCode: 'MD_BANK',
        money: 10000000,
        content: 'Trả lương',
        iat: commonMethod.getIssuedAtNow()
    }
    const dataString = JSON.stringify(data);

    // const xHashedData = await commonMethod.generateToken(data, key.secretString, '1y');
    // console.log('Hashed data: ' + xHashedData);

    // const encryptedData = await otherBankMethod.encrypted(dataString);
    // console.log('Encrypted data: ' + encryptedData);

    // const signedData = await otherBankMethod.signed(dataString);
    // console.log('Signed data: ' + signedData);

    //     const verifiedData = await otherBankMethod.verified(`-----BEGIN PGP SIGNED MESSAGE-----
    // Hash: SHA512

    // {"accountNumber":"123456789","iat":1590514817}
    // -----BEGIN PGP SIGNATURE-----
    // Version: OpenPGP.js v4.10.4
    // Comment: https://openpgpjs.org

    // wsBcBAEBCgAGBQJezVSCAAoJEIxnrBZcmHDW9IAH/iywfeefF7deRsfBxSLl
    // OwsF4UuReJZZ4Qs82rb/2tfk7TRQjR0RmGYOG2XWbeRTzZeqS3DPMd6wI9Zs
    // tr7dB2OC7BI0UAVOVfNPgujMjbjrLqmFR3oaSGWLI4zL0wAth7I8nx42R2EG
    // at4LNcPT2++jT9O1bQPftsR3WNioIBd2fYWzTDoOeRGJD8FqWSSl6haKjuv6
    // D1V7WIBjwgkZP/8nWawPRSwJT0/pulZFdhflYA27PoiSOkpSse/x7PkKW/rr
    // ETwlazBLJPoDEFOtUMMnQa/aGI53avR2z2FYTkinx1KJpeGWgnkJ3H9FBOol
    // 56w+vUUa7Qp01gpxQJsfy5E=
    // =mEJQ
    // -----END PGP SIGNATURE-----`);
    //     console.log(verifiedData);
}
generateKey();

module.exports = router;