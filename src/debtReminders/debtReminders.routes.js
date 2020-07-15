const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const {
    subscribeDebtRemindersAdded
} = require('./sse');

const debtRemindersController = require('./debtReminders.controllers');

// Bắt sự kiện thêm 1 nhắc nợ
router.get('/debt-reminders-add-event', subscribeDebtRemindersAdded);

router.route('/')
    // Lấy danh sách nhắc nợ cho người tạo
    .get(isAuth, debtRemindersController.getCreatingDebtReminders)
    // Tạo nhắc nợ
    .post(isAuth, debtRemindersController.createDebtReminders);

// Lấy danh sách nhắc nợ cho người bị nhắc nợ
router.get('/created-debt-reminders', isAuth, debtRemindersController.getCreatedDebtReminders);

module.exports = router;