const ObjectId = require("mongodb").ObjectId;

const db = require("../../config/dbs");

const COLLECTION = "Transactions";

module.exports = {
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    latestTransaction: async (accountNumber) => {
        const query = {
            accountNumber: accountNumber,
        };
        const transactions = await db.collection(COLLECTION).list(query);
        let index = 0;
        let createdAtMax = 0;
        for (let i = 0; i < transactions.length; i++) {
            if (transactions[i].createdAt > createdAtMax) {
                createdAtMax = transactions[i].createdAt;
                index = i;
            }
        }
        return transactions[index];
    },
    transactionByAccountNumberAndTypeNumber: async (accountNumber, typeNumber) => {
        const query = {
            accountNumber,
            typeNumber
        }
        return await db.collection(COLLECTION).list(query);
    },
    addTransaction: async (transaction) => {
        return await db.collection(COLLECTION).add(transaction);
    },
    addManyTransactions: async (transactions) => {
        return await db.collection(COLLECTION).addMany(transactions);
    },
};