const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'Accounts';

module.exports = {
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    getUser: async (username) => await db.collection(COLLECTION).get({
        username
    }),
    validPassword: async (username, password) => {
        const user = await db.collection(COLLECTION).get({
            username
        });
        if (!user) {
            return false;
        }
        return bcrypt.compare(password, user.password);
    },
    verifyRefreshToken: async (_id, refreshToken) => {
        const user = await db.collection(COLLECTION).detail(_id);
        if (!user) {
            return false;
        }
        if (user.refreshToken !== refreshToken) {
            return false;
        }
        return true;
    },
    updateRefreshToken: async (_id, refreshToken) => {
        const query = {
            _id: ObjectId(_id)
        };
        const newValue = {
            $set: {
                refreshToken: refreshToken
            }
        };
        return await db.collection(COLLECTION).update(query, newValue);
    }
}