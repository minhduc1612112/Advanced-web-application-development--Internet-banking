const accountModel = require('../accounts/accounts.models');
const transactionModel = require('../transactions/transactions.models');

const { getInterbankAccountFunction } = require('../transactions/transactions.controllers');

exports.getAccounts = async (req, res) => {
    const accounts = await accountModel.getAll();
    res.send(accounts);
}

exports.interbankTransaction = async (req, res) => {
    let data = [];

    // Chuyển tiền đến tài khoản ngân hàng khác
    let send = await transactionModel.transactionByTypeNumber(5);
    await Promise.all(send.map(async i => {
        const srcAccount = await accountModel.getAccountByAccountNumber(i.srcAccountNumber);
        const desAccount = await getInterbankAccountFunction(i.desAccountNumber);

        i.srcAccountName=srcAccount.accountName;
        i.desAccountName=desAccount.accountName;
    }))
    data = data.concat(send);

    // Nhận tiền từ tài khoản ngân hàng khác
    let receive = await transactionModel.transactionByTypeNumber(6);
    await Promise.all(receive.map(async i => {
        const srcAccount = await getInterbankAccountFunction(i.srcAccountNumber);
        const desAccount = await accountModel.getAccountByAccountNumber(i.desAccountNumber);
        
        i.srcAccountName=srcAccount.accountName;
        i.desAccountName=desAccount.accountName;
    }));
    data = data.concat(receive);

    res.send(data);
}