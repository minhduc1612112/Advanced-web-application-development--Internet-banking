const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'Accounts';

module.exports = {
    addAccount: async(account)=>{
        return await db.collection(COLLECTION).add(account);
    },
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    getAll: async ()=>{
        return await db.collection(COLLECTION).all();
    },
    getAccount: async (username) => await db.collection(COLLECTION).get({
        username
    }),
    getAccountByAccountNumber: async (accountNumber) => await db.collection(COLLECTION).get({
        accountNumber
    }),
    getAccountByEmail: async (email) => await db.collection(COLLECTION).get({
        email
    }),
    validPassword: async (_id, password) => {
        const account = await db.collection(COLLECTION).get({
            _id
        });
        if (!account) {
            return false;
        }
        return bcrypt.compare(password, account.password);
    },
    verifyRefreshToken: async (_id, refreshToken) => {
        const account = await db.collection(COLLECTION).detail(_id);
        if (!account) {
            return false;
        }
        if (account.refreshToken !== refreshToken) {
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
    },
    updatePassword: async (_id, password) => {
        const query = {
            _id: ObjectId(_id)
        }
        const newValue = {
            $set: {
                password: password
            }
        }
        return await db.collection(COLLECTION).update(query, newValue);
    },
    updateOtpToken: async (_id, otpToken) => {
        const query = {
            _id: ObjectId(_id)
        }
        const newValue = {
            $set: {
                otpToken
            }
        }
        return await db.collection(COLLECTION).update(query, newValue);
    },
    updateReceivers: async (_id, receivers) => {
        const query = {
            _id: ObjectId(_id)
        }
        const newValue = {
            $set: {
                receivers
            }
        }
        return await db.collection(COLLECTION).update(query, newValue);
    }
}