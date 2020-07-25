const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'notifications';

module.exports = {
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    getAll: async () => {
        return await db.collection(COLLECTION).all();
    },
    get10Latest: async (accountNumber) => {
        const query = {
            accountNumber:accountNumber
        }
        return await db.collection(COLLECTION).someLatest(query, 10);
    },
    addNotification: async (notification) => {
        return await db.collection(COLLECTION).add(notification);
    },
    readNotification: async (_id) => {
        const query = {
            _id: ObjectId(_id)
        }
        const value = {
            $set: {
                isRead: true
            }
        }
        return await db.collection(COLLECTION).update(query, value);
    }
}