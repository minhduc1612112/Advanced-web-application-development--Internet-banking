const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

const keyVariable = require("../../variables/keys");
const otherVariable = require('../../variables/others');

const accountModel = require('../accounts/accounts.models');
const transactionModel = require('../transactions/transactions.models');

const commonMethod = require('../common/common.methods');

const { getInterbankAccountFunction } = require('../transactions/transactions.controllers');

exports.getAccounts = async (req, res) => {
    const accounts = await accountModel.getAll();
    res.send(accounts);
}

exports.getAccount = async (req, res) => {
    const accountNumber = req.params.accountNumber;
    const account = await accountModel.getAccountByAccountNumber(accountNumber);
    res.send(account);
}

exports.createAccount = async (req, res) => {
    const accounts = await accountModel.getAll();
    const accountNumbers = accounts.map(i => parseInt(i.accountNumber));

    const accountNumber = (Math.max(...accountNumbers) + 100).toString();
    const accountName = req.body.accountName;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const username = email.split('@')[0];
    let initialPassword = "";
    for (let i = 0; i < 5; i++) {
        initialPassword += Math.floor(Math.random() * 10).toString();
    }
    const password = bcrypt.hashSync(initialPassword, otherVariable.SALT_ROUNDS);

    const account = {
        username,
        email,
        phone,
        address,
        initialPassword,
        password,
        accountNumber,
        accountName
    }

    const transaction = {
        accountNumber,
        accountMoney: 0,
        createdAt: 0
    }

    const createAccount = await accountModel.addAccount(account);
    const createTransaction = await transactionModel.addTransaction(transaction);

    if (!createAccount || !createTransaction) {
        return res.status(400).send('Có lỗi trong quá trình tạo tài khoản, vui lòng thử lại.');
    }

    const result = await accountModel.getAccountByAccountNumber(accountNumber);
    return res.send(result);
}

exports.rechargeIntoAccount = async (req, res) => {
    const accountNumber = req.body.accountNumber,
        money = +req.body.money;

    const account = await accountModel.getAccountByAccountNumber(accountNumber);
    if (!account) {
        return res.status(400).send('Tài khoản không tồn tại, vui lòng nhập lại số tài khoản!');
    }

    const latestTransaction = await transactionModel.latestTransaction(accountNumber);

    const transaction = {
        desAccountNumber: req.body.desAccountNumber,
        desBankCode: keyVariable.bankCode,
        money,
        content: 'Nạp tiền vào tài khoản',
        iat: commonMethod.getIssuedAtNow(),
        accountNumber,
        accountMoney: latestTransaction.accountMoney + money,
        delta: money,
        createdAt: commonMethod.getIssuedAtNow(),
        datetime: commonMethod.getDatetimeNow(),
        typeNumber: 0,
        type: "Nạp tiền vào tài khoản",
    };

    const addTransaction = await transactionModel.addTransaction(transaction);
    if (!addTransaction) {
        return res.status(400).send('Nạp tiền vào tài khoản không thành công, vui lòng thủ lại sau!');
    }

    return res.send(`Nạp thành công số tiền ${money} (VND) vào tài khoản ${accountNumber}`);
}

exports.moneyReceivingTransaction = async (req, res) => {
    const accountNumber = req.params.accountNumber;

    let data = [];

    // Nhận tiền nội bộ
    const internalTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 2);
    await Promise.all(internalTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(internalTransactions);

    // Nhận tiền thanh toán nhắc nợ
    const debtRemindersTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 4);
    await Promise.all(debtRemindersTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(debtRemindersTransactions);

    // Nhận tiền từ tài khoản ngân hàng khác
    const interbankTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 6);
    await Promise.all(interbankTransactions.map(async i => {
        const srcAccount = await getInterbankAccountFunction(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }))
    data = data.concat(interbankTransactions);

    res.send(data);
}

exports.moneySendingTransaction = async (req, res) => {
    const accountNumber = req.params.accountNumber;

    let data = [];

    // Chuyển tiền nội bộ
    const internalTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 1);
    await Promise.all(internalTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }));
    data = data.concat(internalTransactions);

    // Chuyển tiền đến tài khoản ngân hàng khác
    const interbankTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 5);
    await Promise.all(interbankTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await getInterbankAccountFunction(i.desAccountNumber);

        i.srcAccountName = srcAccount ? srcAccount.accountName : null;
        i.desAccountName = desAccount ? desAccount.accountName : null;
    }))
    data = data.concat(interbankTransactions);

    res.send(data);
}

exports.paymentDebtReminders = async (req, res) => {
    const accountNumber = req.params.accountNumber;

    // Chuyển tiền thanh toán nhắc nợ
    const debtRemindersTransactions = await transactionModel.transactionByAccountNumberAndTypeNumber(accountNumber, 3);

    data = await Promise.all(debtRemindersTransactions.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);
        return {
            ...i,
            srcAccountName: srcAccount.accountName,
            desAccountName: desAccount.accountName
        }
    }));

    res.send(data);
}