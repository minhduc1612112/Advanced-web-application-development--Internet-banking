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
        let status = 'Người nợ chưa trả';
        if (i.status === 1) {
            status = 'Người nợ đã trả';
        } else if (i.status === -1) {
            status = 'Nhắc nợ đã bị hủy';
        }
        data.push({
            _id: i._id,
            desAccountNumber: i.desAccountNumber,
            desAccountName: desAccount.accountName,
            debtMoney: i.debtMoney,
            debtContent: i.debtContent,
            datetime: i.datetime,
            status
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.getUnPaidCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatus(account.accountNumber, 0);
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
            status: i.status
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.getPaidCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatus(account.accountNumber, 1);
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
            status: i.status
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.createDebtReminders = async (req, res) => {
    const account = req.account;
    const desAccount = await accountsModels.getAccountByAccountNumber(req.body.accountNumber);

    if (account.accountNumber === desAccount.accountNumber) {
        return res.status(400).send('Tài khoản được tạo nhắc nợ không được là tài khoản của bạn.')
    }

    const debtReminders = {
        srcAccountNumber: account.accountNumber,
        desAccountNumber: req.body.accountNumber,
        debtMoney: +req.body.debtMoney,
        debtContent: req.body.debtContent,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        status: 0
    }

    const createDebtReminders = await debtRemindersModel.addDebtReminders(debtReminders);
    if (!createDebtReminders) {
        return res.status(400).send('Tạo nhắc nợ không thành công, vui lòng thủ lại.');
    }

    const publishResponse = {
        _id: debtReminders._id,
        srcAccountNumber: account.accountNumber,
        srcAccountName: account.accountName,
        debtMoney: debtReminders.debtMoney,
        debtContent: debtReminders.debtContent,
        datetime: debtReminders.datetime,
        status: debtReminders.status
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
        status: debtReminders.status === 1 ? 'Người nợ đã trả' : 'Người nợ chưa trả'
    }

    return res.status(201).send(response);
}