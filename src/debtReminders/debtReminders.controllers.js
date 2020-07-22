const ObjectId = require('mongodb').ObjectId;

const debtRemindersModel = require('./debtReminders.models');

const commonMethod = require('../common/common.methods');

const {
    publishDebtRemindersAdded,
    publishDebtRemindersRemoved,
    publishCreatedDebtRemindersRemoved
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
            statusNumber: i.statusNumber,
            status: i.status
        })
    }))
    data.sort(function (a, b) {
        return b.createdAt - a.createdAt
    });
    return res.send(data);
}

exports.getUnPaidCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatusNumber(account.accountNumber, 0);
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
            statusNumber: i.statusNumber,
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
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatusNumber(account.accountNumber, 1);
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
            statusNumber: i.statusNumber,
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
        statusNumber: 0,
        status: 'Người nợ chưa trả'
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
        statusNumber: debtReminders.statusNumber,
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
        statusNumber: debtReminders.statusNumber,
        status: debtReminders.status
    }

    return res.status(201).send(response);
}

exports.removeDebtReminders = async (req, res) => {
    const _id = req.params._id;
    const debtContent = req.body.debtContent;

    const debtReminders = await debtRemindersModel.detail(_id);
    if (!debtReminders) {
        return res.status(400).send('Nhắc nợ không tồn tại!');
    }

    if (debtReminders.statusNumber !== 0) {
        return res.status(400).send('không thể hủy nhắc nợ này!');
    }

    const updateReminders = await debtRemindersModel.updateStatusAndStatusNumberAndContent(_id, 'Người tạo đã hủy', -2, debtContent);
    if (!updateReminders) {
        return res.status(400).send('Hủy nhắc nợ không thành công, vui lòng thử lại!');
    }

    // sse
    publishDebtRemindersRemoved({
        _id
    });

    const desAccount = await accountsModels.getAccountByAccountNumber(debtReminders.desAccountNumber);

    return res.send({
        ...debtReminders,
        desAccountName: desAccount.accountName,
        debtContent,
        statusNumber: -2,
        status: 'Người tạo đã hủy'
    })
}

exports.removeCreatedDebtReminders = async (req, res) => {
    const _id = req.params._id;
    const debtContent = req.body.debtContent;

    const debtReminders = await debtRemindersModel.detail(_id);
    if (!debtReminders) {
        return res.status(400).send('Nhắc nợ không tồn tại!');
    }

    if (debtReminders.statusNumber !== 0) {
        return res.status(400).send('không thể hủy nhắc nợ này!');
    }

    const updateReminders = await debtRemindersModel.updateStatusAndStatusNumberAndContent(_id, 'Người nợ đã hủy', -1, debtContent);
    if (!updateReminders) {
        return res.status(400).send('Hủy nhắc nợ không thành công, vui lòng thử lại!');
    }

    const desAccount = await accountsModels.getAccountByAccountNumber(debtReminders.desAccountNumber);

    // sse
    publishCreatedDebtRemindersRemoved({
        ...debtReminders,
        _id: debtReminders._id,
        desAccountNumber: desAccount.accountNumber,
        desAccountName: desAccount.accountName,
        debtContent,
        statusNumber: -1,
        status: 'Người nợ đã hủy'
    });

    return res.send({
        _id: debtReminders._id
    })
}