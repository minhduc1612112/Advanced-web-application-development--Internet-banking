const eventEmitter = require('eventemitter3');
const emitter = new eventEmitter();

const subscribeEvent = (req, res, event) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    var heartBeat = setInterval(() => {
        res.write('\n');
    }, 15000);

    var handler = data => {
        var json = JSON.stringify(data);
        res.write(`retry: 500\n`);
        res.write(`event: ${event}\n`);
        res.write(`data: ${json}\n`);
        res.write(`\n`);
    }

    emitter.on(event, handler);

    req.on('close', () => {
        clearInterval(heartBeat);
        emitter.removeListener(event, handler);
    });
};

//
// event pub-sub

const NEW_NOTIFICATION = 'NEW_NOTIFICATION';

const subscribeNewNotification = (req, res) => {
    subscribeEvent(req, res, NEW_NOTIFICATION);
}
const publishNewNotification = notification => {
    emitter.emit(NEW_NOTIFICATION, notification);
}

module.exports = {
    subscribeNewNotification,
    publishNewNotification
}