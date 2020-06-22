const randToken = require('rand-token');

const userModel = require('../users/users.models');
const authMethod = require('./auth.methods');
const jwtVariable = require('../../variables/jwt');

exports.login = async (req, res) => {
    const username = req.body.username.toLowerCase() || 'test';
    const password = req.body.password || '12345';

    const user = await userModel.getUser(username);
    if (!user) {
        return res.status(401).send('Tên đăng nhập không tồn tại.');
    }

    const isPasswordValid = await userModel.validPassword(username, password);
    if (!isPasswordValid) {
        return res.status(401).send('Mật khẩu không chính xác.');
    }

    const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || jwtVariable.auth.accessTokenLife;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || jwtVariable.auth.accessTokenSecret;

    const dataForAccessToken = {
        _id: user._id
    };
    const accessToken = await authMethod.generateToken(dataForAccessToken, accessTokenSecret, accessTokenLife);
    if (!accessToken) {
        return res.status(401).send('Đăng nhập không thành công, vui lòng thử lại.');
    }

    let refreshToken = randToken.generate(jwtVariable.auth.refreshTokenSize); // tạo 1 refresh token ngẫu nhiên
    if (!user.refreshToken) { // Nếu user này chưa có refresh token thì lưu refresh token đó vào database
        await userModel.updateRefreshToken(user._id, refreshToken);
    } else { // Nếu user này đã có refresh token thì lấy refresh token đó từ database
        refreshToken = user.refreshToken;
    }

    user.refreshToken = refreshToken;
    delete user.password;
    return res.json({
        msg: "Đăng nhập thành công.",
        accessToken,
        refreshToken,
        user
    });
}

exports.refreshToken = async (req, res) => {
    // Lấy refresh token từ body
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).send('Không tìm thấy refresh token.');
    }

    // Lấy access token từ header
    const accessTokenFromHeader = req.headers.x_authorization;
    if (!accessTokenFromHeader) {
        return res.status(400).send('Không tìm thấy access token.');
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || jwtVariable.auth.accessTokenSecret;
    const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || jwtVariable.auth.accessTokenLife;

    // Decode access token đó
    const decoded = await authMethod.decodeToken(accessTokenFromHeader, accessTokenSecret);
    if (!decoded) {
        return res.status(400).send('Access token không hợp lệ.');
    }

    const _id = decoded.payload._id; // Lấy username từ payload

    // Kiểm tra refresh token có hợp lệ không (giống như token được lưu trong database)
    const verifyRefreshToken = await userModel.verifyRefreshToken(_id, refreshToken);
    if (verifyRefreshToken === false) {
        return res.status(400).send('Refresh token không hợp lệ.');
    }

    // Tạo access token mới
    const dataForAccessToken = {
        _id
    };

    const accessToken = await authMethod.generateToken(dataForAccessToken, accessTokenSecret, accessTokenLife);
    if (!accessToken) {
        return res.status(401).send('Đăng nhập không thành công, vui lòng thử lại.');
    }
    return res.status(200).json({
        accessToken
    })
};