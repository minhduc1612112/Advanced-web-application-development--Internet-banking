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

const DEBT_REMINDERS_ADDED = 'DEBT_REMINDERS_ADDED';

const subscribeDebtRemindersAdded = (req, res) => {
  subscribeEvent(req, res, DEBT_REMINDERS_ADDED);
}

const publishDebtRemindersAdded = debtReminders => {
  emitter.emit(DEBT_REMINDERS_ADDED, debtReminders);
}

module.exports = {
    subscribeDebtRemindersAdded,
    publishDebtRemindersAdded
}