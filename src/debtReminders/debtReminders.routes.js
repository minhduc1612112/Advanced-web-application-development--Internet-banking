const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const {
    subscribeDebtRemindersAdded,
    subscribeDebtRemindersRemoved,
    subscribeCreatedDebtRemindersRemoved
} = require('./sse');

const debtRemindersController = require('./debtReminders.controllers');

// Tạo sự kiện thêm 1 nhắc nợ
router.get('/debt-reminders-add-event', subscribeDebtRemindersAdded);
// Tạo sự kiện hủy 1 nhắc nợ
router.get('/debt-reminders-remove-event', subscribeDebtRemindersRemoved);
// Tạo sự kiện người nợ hủy 1 nhắc nợ
router.get('/created-debt-reminders-remove-event', subscribeCreatedDebtRemindersRemoved);

router.route('/')
    // Lấy danh sách nhắc nợ cho người tạo
    .get(isAuth, debtRemindersController.getCreatingDebtReminders)
    // Tạo nhắc nợ
    .post(isAuth, debtRemindersController.createDebtReminders);
// Người tạo hủy nhắc nợ
router.post('/remove-debt-reminders/:_id', isAuth, debtRemindersController.removeDebtReminders);

// Lấy danh sách nhắc nợ chưa thanh toán cho người bị nhắc nợ
router.get('/unpaid-created-debt-reminders', isAuth, debtRemindersController.getUnPaidCreatedDebtReminders);

// Lấy danh sách nhắc nợ đã thanh toán cho người bị nhắc nợ
router.get('/paid-created-debt-reminders', isAuth, debtRemindersController.getPaidCreatedDebtReminders);

// Người nợ hủy nhắc nợ
router.post('/remove-created-debt-reminders/:_id', isAuth, debtRemindersController.removeCreatedDebtReminders);

module.exports = router;