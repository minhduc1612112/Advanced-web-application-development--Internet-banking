const accountModel = require('../accounts/accounts.models');
const transactionModel = require('../transactions/transactions.models');

const commonMethod = require('../common/common.methods');

const {
    getInterbankAccountFunction
} = require('../transactions/transactions.controllers');

exports.getAccounts = async (req, res) => {
    const accounts = await accountModel.getAll();
    res.send(accounts);
}

exports.interbankTransaction = async (req, res) => {
    const from = req.query.from,
        to = req.query.to;

    let fromStamp = null,
        toStamp = null;

    if (from) {
        fromStamp = commonMethod.convertDateToUNIX(`${from} 00:00:00`);
    }

    if (to) {
        toStamp = commonMethod.convertDateToUNIX(`${to} 23:59:59`);
    }

    let data = [];

    let sendingMoney = 0,
        receivingMoney = 0;

    // Chuyển tiền đến tài khoản ngân hàng khác
    let send = await transactionModel.transactionByTypeNumberAndCreatedAt(5, fromStamp, toStamp);
    await Promise.all(send.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await getInterbankAccountFunction(i.desAccountNumber);

        i.srcAccountName = srcAccount.accountName;
        i.desAccountName = desAccount.accountName;

        sendingMoney += i.money;
    }))
    data = data.concat(send);

    // Nhận tiền từ tài khoản ngân hàng khác
    let receive = await transactionModel.transactionByTypeNumberAndCreatedAt(6, fromStamp, toStamp);
    await Promise.all(receive.map(async i => {
        const srcAccount = await getInterbankAccountFunction(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);

        i.srcAccountName = srcAccount.accountName;
        i.desAccountName = desAccount.accountName;

        receivingMoney += i.money;
    }));
    data = data.concat(receive);

    res.send({
        transactions: data,
        sendingMoney,
        receivingMoney
    });
}