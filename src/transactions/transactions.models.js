const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'Transactions';

module.exports = {
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    addTransaction: async(transaction)=>{
        return await db.collection(COLLECTION).add(transaction);
    }

}