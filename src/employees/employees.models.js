const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'Employees';

module.exports = {
    addEmployee: async (employee) => {
        return await db.collection(COLLECTION).add(employee);
    },
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    getAll: async () => {
        return await db.collection(COLLECTION).all();
    },
    getEmployee: async (username) => await db.collection(COLLECTION).get({
        username
    }),
    validPassword: async (_id, password) => {
        const employee = await db.collection(COLLECTION).get({
            _id
        });
        if (!employee) {
            return false;
        }
        return bcrypt.compare(password, employee.password);
    },
    verifyRefreshToken: async (_id, refreshToken) => {
        const employee = await db.collection(COLLECTION).detail(_id);
        if (!employee) {
            return false;
        }
        if (employee.refreshToken !== refreshToken) {
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
    deleteEmployee: async (_id) => {
        const query = {
            _id: ObjectId(_id)
        }
        return await db.collection(COLLECTION).delete(query);
    }
}