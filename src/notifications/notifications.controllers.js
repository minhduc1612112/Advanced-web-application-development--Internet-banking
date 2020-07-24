const ObjectId = require('mongodb').ObjectId;

const notificationModel = require('./notifications.models');

const {
    publishNewNotification
} = require('./sse');

exports.getNotifications = async (req, res) => {
    const notifications = await notificationModel.get10Latest();
    let newNotifications = 0;
    notifications.map(i=>{
        if(i.isRead === false){
            newNotifications++;
        }
    })
    res.send({
        newNotifications,
        notifications
    })
}