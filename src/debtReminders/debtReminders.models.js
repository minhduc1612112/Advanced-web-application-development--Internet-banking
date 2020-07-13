const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');

const COLLECTION = 'DebtReminders';

module.exports = {
    detail: async (_id) => {
        return await db.collection(COLLECTION).detail(_id);
    },
    getAll: async () => {
        return await db.collection(COLLECTION).all();
    },
    getDebtRemindersBySrcAccountNumber: async (srcAccountNumber) => {
        const query = {
            srcAccountNumber: srcAccountNumber
        }
        return await db.collection(COLLECTION).list(query);
    },
    getDebtRemindersByDesAccountNumber: async (desAccountNumber) => {
        const query = {
            desAccountNumber: desAccountNumber
        }
        return await db.collection(COLLECTION).list(query);
    },
    addDebtReminders: async (debtReminders) => {
        return await db.collection(COLLECTION).add(debtReminders);
    },
}