const ObjectId = require('mongodb').ObjectId;

const notificationModel = require('./notifications.models');

exports.getNotifications = async (req, res) => {
    const notifications = await notificationModel.get10Latest(req.account.accountNumber);
    let amountNewNotifications = 0;
    notifications.map(i => {
        if (i.isRead === false) {
            amountNewNotifications++;
        }
    })
    res.send({
        amountNewNotifications,
        data: notifications
    })
}

exports.readNotification = async (req, res) => {
    const _id = req.params._id;
    const notification = await notificationModel.detail(_id);
    if (!notification) {
        return res.status(400).end();
    }

    if (notification.isRead === true) {
        return res.status(400).end();
    }

    const readNotification = await notificationModel.readNotification(_id);
    if (!readNotification) {
        return res.status(400).end();
    }

    return res.send({
        ...notification,
        isRead: true
    });
}