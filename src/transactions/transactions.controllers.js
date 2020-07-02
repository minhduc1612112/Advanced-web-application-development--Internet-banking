const nodemailer = require('nodemailer');
const uuid = require('uuidv1');

const keyVariable = require('../../variables/keys');

const transactionModle = require('./transactions.models');
const accountModel = require('../accounts/accounts.models');

const authMethod = require('../auth/auth.methods');

exports.sendOTP = async (req, res) => {
    let email = req.account.email;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    });
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += (Math.floor(Math.random() * 10)).toString();
    }
    const mailOptions = {
        from: '"Internet banking"' + '<' + process.env.EMAIL + ' > ',
        to: email,
        subject: 'Xác thực giao dịch chuyển khoản',
        text: 'Mã OTP xác thực giao dịch chuyển khoản của bạn là: ' + otp + ' , hiệu lực 2 phút'
    };
    transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
            console.log(error);
            return res.status(400).send('Có lỗi trong quá trình gửi mã xác nhận, vui lòng thử lại.')
        }
        console.log('Email sent: ' + info.response);
        const otpToken = await authMethod.generateToken({
            otp,
            email
        }, 'otp_transaction', '2m');

        const updateOtpToken = await accountModel.updateOtpToken(req.account._id, otpToken);
        if (!updateOtpToken) {
            res.status(400).send('Có lỗi trong quá trình lưu mã xác nhận, vui lòng thử lại.');
        }

        res.send('Gửi mã xác thực thành công, vui lòng kiểm tra email để lấy mã xác thực');
    });
}

exports.internalBankTransaction = async (req, res) => {
    const account = req.account;
    const decodedOtpToken = await authMethod.verifyToken(account.otpToken, 'otp_transaction');
    if (!decodedOtpToken) {
        return res.status(400).send('OTP đã hết hạn.')
    }
    const otp = decodedOtpToken.payload.otp;
    const email = decodedOtpToken.payload.email;

    if (email !== req.body.email) {
        return res.status(400).send('Email không hợp lệ.')
    }

    if (otp !== req.body.otp) {
        return res.status(400).send('OTP không hợp lệ.')
    }

    const transaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode:keyVariable.bankCode,
        desAccountNumber: req.body.desAccountNumber,
        desBankCode:keyVariable.bankCode,
        money:req.body.money,
        content:req.body.content,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: account.accountNumber,
        accountMoney: acaccountMoney + data.money,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        type: 0
    }
}