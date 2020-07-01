const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const otherVariable = require('../../variables/others');

const accountModel = require('./accounts.models');

const authMethod = require('../auth/auth.methods');

exports.changePassword = async (req, res) => {
    const oldPassword = req.body.oldPassword,
        newPassword = req.body.newPassword;

    const _id = req.account._id;

    const isPasswordValid = await accountModel.validPassword(_id, oldPassword);
    if (!isPasswordValid) {
        return res.status(409).send('Sai mật khẩu cũ.');
    }

    if (newPassword === oldPassword) {
        return res.status(409).send('Mật khẩu mới không được giống với mật khẩu cũ.')
    }

    const hashPassword = bcrypt.hashSync(newPassword, otherVariable.SALT_ROUNDS);

    const updatePassword = await accountModel.updatePassword(_id, hashPassword);
    if (!updatePassword) {
        return res.status(400).send('Đặt lại mật khẩu không thành công, vui lòng thử lại.')
    }
    return res.send('Đặt lại mật khẩu thành công.');
}

exports.sendConfirmativeCode = async (req, res) => {
    let email = req.body.email;
    const account = await accountModel.getAccountByEmail(email);
    if (!account) {
        return res.status(400).send('Tài khoản không tồn tại.')
    }

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
        subject: 'Thay đổi mật khẩu',
        text: 'Mã xác nhận thay đổi mật khẩu của bạn là: ' + otp
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
        }, 'reset_password', '3m');

        const updateOtpToken = await accountModel.updateOtpToken(account._id, otpToken);
        if (!updateOtpToken) {
            res.status(400).send('Có lỗi trong quá trình lưu mã xác nhận, vui lòng thử lại.');
        }

        res.send('Gửi mã xác thực thành công, vui lòng kiểm tra email để lấy mã xác thực');
    });
}

exports.resetPassword = async (req, res) => {
    // INPUT
    // {
    //     email
    //     otp,
    //     password
    // }

    const account = await accountModel.getAccountByEmail(req.body.email);
    if (!account) {
        return res.status(400).send('Tài khoản không tồn tại.')
    }
    const decodedOtpToken = await authMethod.verifyToken(account.otpToken, 'reset_password');
    if (!decodedOtpToken) {
        return res.status(400).send('OTP đã hết hạn.')
    }
    const otp = decodedOtpToken.payload.otp;
    const email = decodedOtpToken.payload.email;

    if(email !== req.body.email){
        return res.status(400).send('Email không hợp lệ.')
    }

    if (otp !== req.body.otp) {
        return res.status(400).send('OTP không hợp lệ.')
    }

    const hashPassword = bcrypt.hashSync(req.body.password, otherVariable.SALT_ROUNDS);
    const updatePassword = await accountModel.updatePassword(account._id, hashPassword);
    if (!updatePassword) {
        return res.status(400).send('Đặt lại mật khẩu không thành công, vui lòng thử lại.')
    }
    return res.send('Đặt lại mật khẩu thành công');
}