const ObjectId = require('mongodb').ObjectId;

const debtRemindersModel = require('./debtReminders.models');
const accountModel = require('../accounts/accounts.models');
const transactionModle = require('../transactions/transactions.models');

const commonMethod = require('../common/common.methods');
const authMethod = require('../auth/auth.methods');

const keyVariable = require('../../variables/keys');

const {
    publishDebtRemindersAdded,
    publishDebtRemindersRemoved,
    publishCreatedDebtRemindersRemoved,
    publishCreatedDebtRemindersPaymented
} = require('./sse');

exports.detail = async (req, res) => {
    const _id = req.params._id;
    const debtReminders = await debtRemindersModel.detail(_id);
    return res.send(debtReminders);
}

exports.getCreatingDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersBySrcAccountNumber(account.accountNumber);
    return res.send(debtRemindersList);
}

exports.getUnPaidCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatusNumber(account.accountNumber, 0);
    return res.send(debtRemindersList);
}

exports.getPaidCreatedDebtReminders = async (req, res) => {
    const account = req.account;
    const debtRemindersList = await debtRemindersModel.getDebtRemindersByDesAccountNumberAndStatusNumber(account.accountNumber, 1);
    return res.send(debtRemindersList);
}

exports.createDebtReminders = async (req, res) => {
    const account = req.account;
    const desAccount = await accountModel.getAccountByAccountNumber(req.body.accountNumber);

    if (account.accountNumber === desAccount.accountNumber) {
        return res.status(400).send('Tài khoản được tạo nhắc nợ không được là tài khoản của bạn.')
    }

    const debtReminders = {
        srcAccountNumber: account.accountNumber,
        srcAccountName: account.accountName,
        desAccountNumber: desAccount.accountNumber,
        desAccountName: desAccount.accountName,
        debtMoney: +req.body.debtMoney,
        debtContent: req.body.debtContent,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        statusNumber: 0,
        status: 'Người nợ chưa trả'
    }

    const createDebtReminders = await debtRemindersModel.addDebtReminders(debtReminders);
    if (!createDebtReminders) {
        return res.status(400).send('Tạo nhắc nợ không thành công, vui lòng thử lại.');
    }

    // sse
    publishDebtRemindersAdded(debtReminders);

    return res.status(201).send(debtReminders);
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

    return res.send({
        ...debtReminders,
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

    // sse
    publishCreatedDebtRemindersRemoved({
        ...debtReminders,
        debtContent,
        statusNumber: -1,
        status: 'Người nợ đã hủy'
    });

    return res.send({
        _id
    })
}

exports.paymentCreatedDebtReminders = async (req, res) => {
    const _id = req.params._id;
    const debtContent = req.body.debtContent;

    const account = req.account;
    const decodedOtpToken = await authMethod.verifyToken(
        account.otpToken,
        "otp_transaction"
    );

    if (!decodedOtpToken) {
        return res.status(400).send("OTP đã hết hạn.");
    }

    const otp = decodedOtpToken.payload.otp;
    const email = decodedOtpToken.payload.email;

    if (email !== account.email) {
        return res.status(400).send("Email không hợp lệ.");
    }

    if (otp !== req.body.otp) {
        return res.status(400).send("OTP không hợp lệ.");
    }

    const debtReminders = await debtRemindersModel.detail(_id);

    // Tài khoản đích của giao dịch chính là tài khoản nguồn của nhắc nợ
    const desAccount = await accountModel.getAccountByAccountNumber(debtReminders.srcAccountNumber);

    if (!desAccount) {
        return res.status(400).send("Tài khoản đích không tồn tại");
    }

    const srcLatestTransaction = await transactionModle.latestTransaction(account.accountNumber);
    const desLatestTransaction = await transactionModle.latestTransaction(desAccount.accountNumber);

    if (debtReminders.debtMoney > (srcLatestTransaction.accountMoney + 1000 + 50000)) {
        return res.status(400).send("Số dư hiện tại của bạn không đủ");
    }

    const srcTransaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode: keyVariable.bankCode,
        desAccountNumber: desAccount.accountNumber,
        desBankCode: keyVariable.bankCode,
        money: debtReminders.debtMoney,
        content: debtContent,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: account.accountNumber,
        accountMoney: srcLatestTransaction.accountMoney - (debtReminders.debtMoney + 1000),
        delta: -(debtReminders.debtMoney + 1000),
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 3,
        type: "Chuyển tiền thanh toán nhắc nợ",
    };

    const desTransaction = {
        srcAccountNumber: account.accountNumber,
        srcBankCode: keyVariable.bankCode,
        desAccountNumber: desAccount.accountNumber,
        desBankCode: keyVariable.bankCode,
        money: debtReminders.debtMoney,
        content: debtContent,
        iat: commonMethod.getIssuedAtNow(),
        accountNumber: desAccount.accountNumber,
        accountMoney: desLatestTransaction.accountMoney + debtReminders.debtMoney,
        delta: debtReminders.debtMoney,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 4,
        type: "Nhận tiền thanh toán nhắc nợ",
    };

    const addManyTransactions = await transactionModle.addManyTransactions([
        srcTransaction,
        desTransaction,
    ]);
    if (!addManyTransactions) {
        return res.status(400).send("Giao dịch không thành công, vui lòng thử lại.");
    }

    const updateReminders = await debtRemindersModel.updateStatusAndStatusNumberAndContent(_id, 'Người nợ đã trả', 1, debtContent);
    if (!updateReminders) {
        return res.status(400).send('Thanh toán nhắc nợ không thành công, vui lòng thử lại!');
    }

    // sse
    publishCreatedDebtRemindersPaymented({
        ...debtReminders,
        debtContent,
        statusNumber: 1,
        status: 'Người nợ đã trả'
    });

    return res.send({
        transaction: {
            ...srcTransaction,
            desAccountName: desAccount.accountName
        },
        debtReminders: {
            ...debtReminders,
            debtContent,
            statusNumber: 1,
            status: 'Người nợ đã trả'
        },
    });
}