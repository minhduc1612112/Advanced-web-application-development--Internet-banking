const express = require('express');
const router = express.Router();

const {
    isAuth
} = require('../auth/auth.middlewares');

const {
    subscribeNewNotification,
} = require('./sse');

const notificationController = require('./notifications.controllers');

// Tạo sự kiện khi có thông báo mới
router.get('/new-notification-event', subscribeNewNotification);

router.route('/').get(isAuth, notificationController.getNotifications);

module.exports = router;