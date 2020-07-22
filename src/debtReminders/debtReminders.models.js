const ObjectId = require('mongodb').ObjectId;

const db = require('../../config/dbs');
const {
    query
} = require('express');

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
    getDebtRemindersByDesAccountNumberAndStatusNumber: async (desAccountNumber, statusNumber) => {
        const query = {
            desAccountNumber: desAccountNumber,
            statusNumber: statusNumber
        }
        return await db.collection(COLLECTION).list(query);
    },
    addDebtReminders: async (debtReminders) => {
        return await db.collection(COLLECTION).add(debtReminders);
    },
    updateStatusAndStatusNumberAndContent: async (_id, status, statusNumber, debtContent) => {
        const query = {
            _id: ObjectId(_id)
        }
        const value = {
            $set: {
                status: status,
                statusNumber: statusNumber,
                debtContent: debtContent
            }
        }
        return await db.collection(COLLECTION).update(query, value);
    }
}