const momentTZ = require('moment-timezone');
const moment = require('moment');
const jwtDecode = require('jwt-decode');
const jwt = require('jsonwebtoken');
const promisify = require('util').promisify;
const jwt_sign = promisify(jwt.sign).bind(jwt);
const jwt_verify = promisify(jwt.verify).bind(jwt);

// Phát sinh ra access token
exports.generateToken = async (payload, secretSignature, tokenLife) => {
    try {
        const accessToken = await jwt_sign({
            payload
        }, secretSignature, {
            algorithm: "HS256",
            expiresIn: tokenLife,
        })
        return accessToken;
    } catch (error) {
        console.log('Error in generate token: ' + error.message);
        return null;
    }
}

// Verify token
exports.verifyToken = async (token, secretSignature) => {
    try {
        const decoded = await jwt_verify(token, secretSignature);
        return decoded;
    } catch (error) {
        console.log('Error in verity token: ' + error.message);
        return null;
    }
}

// Decode token
exports.decodeToken = async (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded;
    } catch (error) {
        console.log('Error in decode token: ' + error.message);
        return null;
    }
}

// Trả về thời gian hiện tại theo định dạng UNIX time
exports.getIssuedAtNow = () => {
    return momentTZ.tz('Asia/Bangkok').unix();
}

// Trả về ngày giờ hiện tại theo định dạng DD/MM/YYYY HH:mm:ss
exports.getDatetimeNow = () => {
    return momentTZ.tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm:ss');
}

// Trả về ngày giờ hiện tại theo định dạng YYYY-MM-DD HH:mm:ss
exports.getDatetimeNow1 = () => {
    return momentTZ.tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
}

exports.convertDateToUNIX = (datetime) => {
    try {
        return moment(datetime, "YYYY-MM-DD HH:mm:ss").unix();
    } catch (error) {
        return null;
    }
}