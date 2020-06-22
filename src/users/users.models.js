const db = require('../../config/dbs');
const COLLECTION = 'users';

exports.getUser = (username) => {
    return db.collection(COLLECTION).get({
        username
    });
}