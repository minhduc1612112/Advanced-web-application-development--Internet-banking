const bcrypt = require('bcrypt');

const otherVariable = require('../../variables/others');

const accountModel = require('../accounts/accounts.models');
const transactionModel = require('../transactions/transactions.models');
const employeeModel = require('../employees/employees.models');

const commonMethod = require('../common/common.methods');

const {
    getInterbankAccountFunction
} = require('../transactions/transactions.controllers');

exports.getEmployees = async (req, res) => {
    const employees = await employeeModel.getAll();
    res.send(employees);
}

exports.createEmployee = async (req, res) => {
    const username = req.body.username.toLowerCase();

    const employee = await employeeModel.getEmployee(username);
    if (employee) {
        return res.status(409).send("Tên đăng nhập đã tồn tại.");
    }

    let initialPassword = "";
    for (let i = 0; i < 5; i++) {
        initialPassword += Math.floor(Math.random() * 10).toString();
    }
    const password = bcrypt.hashSync(initialPassword, otherVariable.SALT_ROUNDS);

    const newEmployee = {
        username,
        initialPassword,
        password,
        name: req.body.name,
        phone: req.body.phone
    }

    const createEmployee = await employeeModel.addEmployee(newEmployee);
    if (!createEmployee) {
        return res.status(400).send('Có lỗi trong quá trình tạo tài khoản nhân viên, vui lòng thử lại.');
    }

    const data = await employeeModel.getEmployee(username);
    res.send(data);
}

exports.deleteEmployee = async (req, res) => {
    const _id = req.params._id;
    const employee = await employeeModel.detail(_id);
    if (!employee) {
        return res.status(400).send('Nhân viên không tồn tại.');
    }
    
    const deleteEmployee = await employeeModel.deleteEmployee(_id);
    if (!deleteEmployee) {
        return res.status(400).send('Xóa nhân viên không thành công, vui lòng thử lại.');
    }
    return res.send({
        _id
    })
}

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