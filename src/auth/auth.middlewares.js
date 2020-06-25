const jwtVariable = require('../../variables/jwt');

const accountModel = require('../accounts/accounts.models');

const authMethod = require('./auth.methods');

exports.isAuth = async (req, res, next) => {
    // Lấy access token từ header
    const accessTokenFromHeader = req.headers.x_authorization;
    if (!accessTokenFromHeader) {
        console.log('Không tìm thấy access token.');
        return res.status(401).send('Bạn không có quyền truy cập vào tính năng này!');
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || jwtVariable.auth.accessTokenSecret;

    const verified = await authMethod.verifyToken(accessTokenFromHeader, accessTokenSecret);
    if (!verified) {
        return res.status(401).send('Bạn không có quyền truy cập vào tính năng này!');
    }

    const user = await accountModel.detail(verified.payload._id);
    req.user = user;

    return next();
}