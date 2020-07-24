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
    get10Latest:async () =>{
        return await db.collection(COLLECTION).someLatest(10);
    },
    addNotification: async (notification) => {
        return await db.collection(COLLECTION).add(notification);
    },
}