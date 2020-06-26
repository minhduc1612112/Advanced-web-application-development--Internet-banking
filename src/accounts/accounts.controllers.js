const bcrypt = require('bcrypt');
const otherVariable = require('../../variables/others');

const accountModel = require('./accounts.models');

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
        return res.status(400).send('Thay đổi mật khẩu không thành công, vui lòng thử lại.')
    }
    res.status(200).send('Thay đổi mật khẩu thành công.');
}