const accountModel = require('./accounts.models');

exports.getProfile = async (req, res) => {
    res.send(req.user);
}