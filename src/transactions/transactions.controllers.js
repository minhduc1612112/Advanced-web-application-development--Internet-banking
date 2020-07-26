const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectId;
const axios = require('axios');
const sha256 = require('sha256');
const NodeRSA = require('node-rsa');

const keyVariable = require("../../variables/keys");
const anotherKeyVariable = require('../../variables/another-bank-keys');

const transactionModle = require("./transactions.models");
const accountModel = require("../accounts/accounts.models");

const authMethod = require("../auth/auth.methods");
const commonMethod = require("../common/common.methods");

exports.sendOTP = async (req, res) => {
    let email = req.account.email;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    });
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    const mailOptions = {
        from: '"Internet banking"' + "<" + process.env.EMAIL + " > ",
        to: email,
        subject: "Xác thực giao dịch chuyển khoản",
        text: "Mã OTP xác thực giao dịch chuyển khoản của bạn là: " +
            otp +
            " , otp có hiệu lực 3 phút. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
    };
    transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
            console.log(error);
            return res
                .status(400)
                .send("Có lỗi trong quá trình gửi mã xác nhận, vui lòng thử lại.");
        }
        console.log("Email sent: " + info.response);
        const otpToken = await authMethod.generateToken({
                otp,
                email,
            },
            "otp_transaction",
            "3m"
        );

        const updateOtpToken = await accountModel.updateOtpToken(
            req.account._id,
            otpToken
        );
        if (!updateOtpToken) {
            res
                .status(400)
                .send("Có lỗi trong quá trình lưu mã xác nhận, vui lòng thử lại.");
        }

        res.send(
            "Gửi mã xác thực thành công, vui lòng kiểm tra email để lấy mã xác thực"
        );
    });
};

exports.internalBankTransaction = async (req, res) => {
    const account = req.account;
    const decodedOtpToken = await authMethod.verifyToken(
        account.otpToken,
        "otp_transaction"
    );

    if (account.accountNumber === req.body.desAccountNumber) {
        return res
            .status(400)
            .send("Tài khoản nguồn không được giống tài khoản đích.");
    }

    if (!decodedOtpToken) {
        return res.status(400).send("OTP đã hết hạn.");
    }

    const otp = decodedOtpToken.payload.otp;
    const email = decodedOtpToken.payload.email;

    if (email !== account.email) {
        return res.status(400).send("Email không hợp lệ.");
    }

    if (otp !== req.body.otp) {
        return res.status(400).send("OTP không hợp lệ.");
    }

    const formOfFeePayment = req.body.formOfFeePayment;

    const srcLatestTransaction = await transactionModle.latestTransaction(
        account.accountNumber
    );

    const desAccount = await accountModel.getAccountByAccountNumber(
        req.body.desAccountNumber
    );
    if (!desAccount) {
        return res.status(400).send("Tài khoản đích không tồn tại");
    }

    const desLatestTransaction = await transactionModle.latestTransaction(
        req.body.desAccountNumber
    );

    let srcAccountMoney, desAccountMoney, srcDelta, desDelta;
    if (formOfFeePayment === 0) {
        srcDelta = -parseInt(req.body.money) - 1000;
        desDelta = parseInt(req.body.money);
        srcAccountMoney = srcLatestTransaction.accountMoney + srcDelta;
        desAccountMoney = desLatestTransaction.accountMoney + desDelta;
    } else {
        srcDelta = -parseInt(req.body.money);
        desDelta = parseInt(req.body.money) - 1000;
        srcAccountMoney = srcLatestTransaction.accountMoney + srcDelta;
        desAccountMoney = desLatestTransaction.accountMoney + desDelta;
    }

    const srcTransaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode: keyVariable.bankCode,
        desAccountNumber: req.body.desAccountNumber,
        desBankCode: keyVariable.bankCode,
        money: +req.body.money,
        content: req.body.content,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: srcLatestTransaction.accountNumber,
        accountMoney: srcAccountMoney,
        delta: srcDelta,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 1,
        type: "Chuyển tiền đến tài khoản ngân hàng nội bộ",
    };

    const desTransaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode: keyVariable.bankCode,
        desAccountNumber: req.body.desAccountNumber,
        desBankCode: keyVariable.bankCode,
        money: +req.body.money,
        content: req.body.content,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: desLatestTransaction.accountNumber,
        accountMoney: desAccountMoney,
        delta: desDelta,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 2,
        type: "Nhận tiền từ tài khoản ngân hàng nội bộ",
    };

    const addManyTransactions = await transactionModle.addManyTransactions([
        srcTransaction,
        desTransaction,
    ]);
    if (!addManyTransactions) {
        return res.status(400).send("Giao dịch không thành công, vui lòng thử lại.");
    }
    return res.send({
        ...srcTransaction,
        desAccountName: desAccount.accountName
    });
};

exports.getInterbankAccountFunction = async (accountNumber) => {
    const timestamp = commonMethod.getDatetimeNow1();
    const secretSign = anotherKeyVariable.secretSign;
    const partnerCode = anotherKeyVariable.partnerCode;
    const body = {
        stk_thanh_toan: accountNumber
    }
    const sign = sha256(JSON.stringify(body) + timestamp + secretSign + partnerCode);

    const {
        data
    } = await axios.post('https://smartbankinghk.herokuapp.com/api/foreign-bank/info', body, {
        headers: {
            'x-partner-code': partnerCode,
            'x-timestamp': timestamp,
            'x-sign': sign
        }
    });
    if (data.status !== 1) {
        return null;
    }

    const account = {
        _id: ObjectId().toString(),
        accountNumber,
        accountName: data.ten
    }
    return account;
}

exports.getInterbankAccount = async (req, res) => {
    const accountNumber = req.params.accountNumber;
    const account = await this.getInterbankAccountFunction(accountNumber);
    if (!account) {
        return res.end();
    }
    return res.send(account);
}

exports.interbankTransaction = async (req, res) => {
    const account = req.account;
    const decodedOtpToken = await authMethod.verifyToken(
        account.otpToken,
        "otp_transaction"
    );

    if (account.accountNumber === req.body.desAccountNumber) {
        return res.status(400).send("Tài khoản nguồn không được giống tài khoản đích.");
    }

    if (!decodedOtpToken) {
        return res.status(400).send("OTP đã hết hạn.");
    }

    const otp = decodedOtpToken.payload.otp;
    const email = decodedOtpToken.payload.email;

    if (email !== account.email) {
        return res.status(400).send("Email không hợp lệ.");
    }

    if (otp !== req.body.otp) {
        return res.status(400).send("OTP không hợp lệ.");
    }

    const formOfFeePayment = req.body.formOfFeePayment;

    const srcLatestTransaction = await transactionModle.latestTransaction(
        account.accountNumber
    );

    // const timestamp = commonMethod.getDatetimeNow1();
    // const secretSign = anotherKeyVariable.secretSign;
    // const partnerCode = anotherKeyVariable.partnerCode;
    // const body = {
    //     stk_nguoi_gui: account.accountName,
    //     stk_thanh_toan: req.body.desAccountNumber,
    //     soTien: req.body.money,
    //     noi_dung: req.body.content
    // }
    // const sign = sha256(JSON.stringify(body) + timestamp + secretSign + partnerCode);

    // const key = new NodeRSA(keyVariable.pgp.private);
    // const rsaSign = key.sign(timestamp,'base64','utf8');

    // const {
    //     data
    // } = await axios.post('https://smartbankinghk.herokuapp.com/api/foreign-bank/info', body, {
    //     headers: {
    //         'x-partner-code': partnerCode,
    //         'x-timestamp': timestamp,
    //         'x-sign': sign,
    //         'x-rsa-sign':rsaSign
    //     }
    // });

    let srcAccountMoney, srcDelta;
    if (formOfFeePayment === 0) {
        srcDelta = -parseInt(req.body.money) - 5000;
        srcAccountMoney = srcLatestTransaction.accountMoney + srcDelta;
    } else {
        srcDelta = -parseInt(req.body.money);
        srcAccountMoney = srcLatestTransaction.accountMoney + srcDelta;
    }

    const srcTransaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode: keyVariable.bankCode,
        desAccountNumber: req.body.desAccountNumber,
        desBankCode: "Interbank",
        money: +req.body.money,
        content: req.body.content,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: srcLatestTransaction.accountNumber,
        accountMoney: srcAccountMoney,
        delta: srcDelta,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 5,
        type: "Chuyển tiền đến tài khoản ngân hàng khác",
    };

    const addTransaction = await transactionModle.addTransaction(srcTransaction);
    if (!addTransaction) {
        return res.status(400).send("Giao dịch không thành công, vui lòng thử lại.");
    }
    return res.send({
        ...srcTransaction,
        desAccountName: req.body.desAccountName
    });
}

exports.moneyReceivingTransaction = async (req, res) => {
    const accountNumber = req.account.accountNumber;

    let data = [];

    // Nhận tiền nội bộ
    const internalTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 2);
    await Promise.all(internalTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(internalTransactions);

    // Nhận tiền thanh toán nhắc nợ
    const debtRemindersTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 4);
    await Promise.all(debtRemindersTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(debtRemindersTransactions);

    // Nhận tiền từ tài khoản ngân hàng khác
    const interbankTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 6);
    await Promise.all(interbankTransactions.map(async i => {
        const srcAccount = await this.getInterbankAccountFunction(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }))
    data = data.concat(interbankTransactions);

    res.send(data);
}

exports.moneySendingTransaction = async (req, res) => {
    const accountNumber = req.account.accountNumber;

    let data = [];

    // Chuyển tiền nội bộ
    let internalTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 1);
    await Promise.all(internalTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(internalTransactions);

    // Chuyển tiền đến tài khoản ngân hàng khác
    const interbankTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 5);
    await Promise.all(interbankTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await this.getInterbankAccountFunction(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }))
    data = data.concat(interbankTransactions);

    res.send(data);
}

exports.paymentDebtReminders = async (req, res) => {
    const accountNumber = req.account.accountNumber;

    // Chuyển tiền thanh toán nhắc nợ
    const debtRemindersTransactions = await transactionModle.transactionByAccountNumberAndTypeNumber(accountNumber, 3);

    data = await Promise.all(debtRemindersTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);
        return {
            ...i,
            srcAccountName: srcAccount.accountName,
            desAccountName: desAccount.accountName
        }
    }));

    res.send(data);
}