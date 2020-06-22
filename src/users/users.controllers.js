const userModel = require('./users.models');

exports.getProfile = async (req, res) => {
    res.send(req.user);
}