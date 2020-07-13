const ObjectId = require('mongodb').ObjectId;

const debtRemindersModel = require('./debtReminders.models');

const commonMethod = require('../common/common.methods');

const {
    publishDebtRemindersAdded
} = require('./sse');

exports.getCreatingDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersBySrcAccountNumber(account.accountNumber);
    return res.send(debtRemindersList);
}

exports.getCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersBySrcAccountNumber(account.accountNumber);
    return res.send(debtRemindersList);
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

    // sse
    publishDebtRemindersAdded(debtReminders);

    return res.status(201).send(debtReminders);
}