{
    secretString: 'Internet-banking--group-2',
    API1 = {
        Name: "Truy vấn thông tin tài khoản của ngân hàng khác",
        Method: "POST",
        URL: "https://api-server-internet-banking.herokuapp.com/other-banks/query-account-information",
        Input: {
            headers: "x_hashed_data: Là 1 jwt được tạo như (1)",
            body: {
                encrypted_data: "Được tạo như (2)"
            }
        },
        Output: { // Có 4 lạo sau
            1: res.status(401).send({
                status: -1,
                msg: 'Ngân hàng của bạn chưa được liên kết với ngân hàng này.'
            }),
            2: res.status(400).send({
                status: -2,
                msg: 'Lời gọi này là thông tin cũ đã quá hạn.'
            }),
            3: res.status(400).send({
                status: -3,
                msg: 'Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.'
            }),
            4: res.status(200).send({
                desAccountNumber: 'String',
                desAccountName: 'String'
            })
        }
    },
    API2 = {
        Name: "Nạp tiền vào tài khoản của ngân hàng khác",
        Method: "POST",
        URL: "https://api-server-internet-banking.herokuapp.com/other-banks/payment-on-account",
        Input: {
            headers: "x_hashed_data: Là 1 jwt được tạo như (3)",
            body: {
                encrypted_data: 'Được tạo như (4)',
                signed_data: 'Được tạo như (5)'
            }
        },
        Output: { // Có 5 loại sau
            1: res.status(401).send({
                status: -1,
                msg: 'Ngân hàng của bạn chưa được liên kết với ngân hàng này.'
            }),
            2: res.status(400).send({
                status: -2,
                msg: 'Lời gọi này là thông tin cũ đã quá hạn.'
            }),
            3: res.status(400).send({
                status: -3,
                msg: 'Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.'
            }),
            4: res.status(400).send({
                status: -4,
                msg: 'Chữ kí không hợp lệ.'
            }),
            5: res.send({
                status: 1,
                msg: 'Giao dịch thành công',
                signedData: 'Data trả về đã được ký',
            })
        }
    },
    pgp_public = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

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
8AWiab9Ql0r59iK4R18ZPdOrb7PGFg==
=pD00
-----END PGP PUBLIC KEY BLOCK-----`
}




const openpgp = require('openpgp');
const momentTZ = require('moment-timezone');
// Trả về thời gian hiện tại theo định dạng UNIX time
const getIssuedAtNow = () => {
    return momentTZ.tz('Asia/Bangkok').unix();
}

// ================== (1) ===================
const payload = {
    desAccountNumber: '123456789',
    desBankCode: 'GROUP2Bank',
    iat: getIssuedAtNow()
}

const x_hashed_data = await jwt_sign({
    payload
}, secretString, {
    algorithm: "HS256",
    expiresIn: "10m",
})
// ========================================


// ================== (2) ===================
const data = {
    desAccountNumber: '123456789',
    desBankCode: 'GROUP2Bank',
    iat: getIssuedAtNow()
}
const dataString = JSON.stringify(data);

const encrypted_data = async () => {
    await openpgp.initWorker();

    const publicKeyArmored = 'PUBLIC KEY...';

    const {
        data: encrypted
    } = await openpgp.encrypt({
        message: openpgp.message.fromText(dataString), // input as Message object
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
    });

    openpgp.destroyWorker();

    return encrypted;
}
// ===========================================

// ================== (3) ===================
const payload = {
    srcAccountNumber: 'Định dạng string',
    srcBankCode: 'Định dạng string',
    desAccountNumber: '123456789',
    desBankCode: 'GROUP2Bank',
    money: 'Định dạng number',
    content: 'Định dạng string',
    iat: commonMethod.getIssuedAtNow()
}

const x_hashed_data = await jwt_sign({
    payload
}, secretString, {
    algorithm: "HS256",
    expiresIn: "10m",
})
// ========================================


// ================== (4) ===================
const data = {
    srcAccountNumber: 'Định dạng string',
    srcBankCode: 'Định dạng string',
    desAccountNumber: '123456789',
    desBankCode: 'GROUP2Bank',
    money: 'Định dạng number',
    content: 'Định dạng string',
    iat: commonMethod.getIssuedAtNow()
}
const dataString = JSON.stringify(data);

const encrypted_data = async () => {
    await openpgp.initWorker();

    const publicKeyArmored = 'PUBLIC KEY...';

    const {
        data: encrypted
    } = await openpgp.encrypt({
        message: openpgp.message.fromText(dataString), // input as Message object
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for encryption
    });

    openpgp.destroyWorker();

    return encrypted;
}
// ==============================================

// ===================== (5) =====================
const data = {
    srcAccountNumber: 'Định dạng string',
    srcBankCode: 'Định dạng string',
    desAccountNumber: '123456789',
    desBankCode: 'GROUP2Bank',
    money: 'Định dạng number',
    content: 'Định dạng string',
    iat: commonMethod.getIssuedAtNow()
}
const dataString = JSON.stringify(data);

const signed_data = async () => {
    await openpgp.initWorker();

    const privateKeyArmored = 'YOUR PRIVATE KEY'; // encrypted private key
    const passphrase = 'YOUR PASSPHRASE'; // what the private key is encrypted with

    const {
        keys: [privateKey]
    } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    const {
        data: cleartext
    } = await openpgp.sign({
        message: openpgp.cleartext.fromText(dataString), // CleartextMessage or Message object
        privateKeys: [privateKey] // for signing
    });

    openpgp.destroyWorker();

    return cleartext; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
}
// ============================================