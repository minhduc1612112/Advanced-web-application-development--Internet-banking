const ObjectId = require('mongodb').ObjectId;

const debtRemindersModel = require('./debtReminders.models');

const commonMethod = require('../common/common.methods');

const {
    publishDebtRemindersAdded
} = require('./sse');
const accountsModels = require('../accounts/accounts.models');

exports.getCreatingDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersBySrcAccountNumber(account.accountNumber);
    let data = [];
    await Promise.all(debtRemindersList.map(async i => {
        const desAccount = await accountsModels.getAccountByAccountNumber(i.desAccountNumber);
        data.push({
            _id: i._id,
            desAccountNumber: i.desAccountNumber,
            desAccountName: desAccount.accountName,
            debtMoney: i.debtMoney,
            debtContent: i.debtContent,
            datetime: i.datetime,
            status: i.isPay ? 'Người nợ đã trả' : 'Người nợ chưa trả'
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.getCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumber(account.accountNumber);
    let data = [];
    await Promise.all(debtRemindersList.map(async i => {
        const srcAccount = await accountsModels.getAccountByAccountNumber(i.srcAccountNumber);
        data.push({
            _id: i._id,
            srcAccountNumber: i.srcAccountNumber,
            srcAccountName: srcAccount.accountName,
            debtMoney: i.debtMoney,
            debtContent: i.debtContent,
            datetime: i.datetime,
            isPay: i.isPay
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.createDebtReminders = async (req, res) => {
    const account = req.account;
    const debtReminders = {
        srcAccountNumber: account.accountNumber,
        desAccountNumber: req.body.accountNumber,
        debtMoney: +req.body.debtMoney,
        debtContent: req.body.debtContent,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        isPay: false
    }

    const createDebtReminders = await debtRemindersModel.addDebtReminders(debtReminders);
    if (!createDebtReminders) {
        return res.status(400).send('Tạo nhắc nợ không thành công, vui lòng thủ lại.')
    }

    const srcAccount = await accountsModels.getAccountByAccountNumber(account.accountNumber);
    const desAccount = await accountsModels.getAccountByAccountNumber(req.body.accountNumber);

    const publishResponse = {
        _id: debtReminders._id,
        srcAccountNumber: srcAccount.accountNumber,
        srcAccountName: srcAccount.accountName,
        debtMoney: debtReminders.debtMoney,
        debtContent: debtReminders.debtContent,
        datetime: debtReminders.datetime,
        isPay: debtReminders.isPay
    }

    // sse
    publishDebtRemindersAdded(publishResponse);

    const response = {
        _id: debtReminders._id,
        desAccountNumber: desAccount.accountNumber,
        desAccountName: desAccount.accountName,
        debtMoney: debtReminders.debtMoney,
        debtContent: debtReminders.debtContent,
        datetime: debtReminders.datetime,
        status: debtReminders.isPay ? 'Người nợ đã trả' : 'Người nợ chưa trả'
    }

    return res.status(201).send(response);
}