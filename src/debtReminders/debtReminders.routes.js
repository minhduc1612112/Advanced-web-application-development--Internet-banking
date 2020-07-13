const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const {
    subscribeDebtRemindersAdded
} = require('./sse');

const debtRemindersController = require('./debtReminders.controllers');

router.get('/debt-reminders-add-event', subscribeDebtRemindersAdded);
router.route('/')
    .get(isAuth, debtRemindersController.getCreatingDebtReminders)
    .post(isAuth, debtRemindersController.createDebtReminders);

router.get('/')

module.exports = router;