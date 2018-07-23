/* eslint-disable max-statements */
const Primus = require('./primus');
const logger = require('../logging/logger');
const systemInfo = require('../logging/system-info');

const messageHandlers = {};

let connection = null;

function connect(displayId, machineId) {
  const url = `https://services.risevision.com/messaging/primus/?displayId=${displayId}&machineId=${machineId}`;
  connection = Primus.connect(url, {
    reconnect: {
      max: 1800000,
      min: 2000,
      retries: Infinity
    },
    manual: true
  });

  connection.on('open', () => logger.log('MS connection opened'));
  connection.on('close', () => logger.log('MS connection closed'));
  connection.on('end', () => logger.log('MS disconnected'));
  connection.on('error', (error) => logger.error('MS connection error', error));
  connection.on('reconnect', () => logger.log('MS reconnection attempt started'));
  connection.on('reconnected', () => logger.log('MS successfully reconnected'));
  connection.on('data', (data) => {
    logger.log('MS received data', data);

    const key = data.topic || data.msg || data;
    if (typeof key === 'string') {
      const handlers = messageHandlers[key.toLowerCase()];
      if (handlers && handlers.length > 0) {
        handlers.forEach(handler => handler(data));
      }
    }
  });

  connection.open();

  return new Promise((resolve, reject) => {
    connection.on('open', resolve);
    connection.on('error', reject);
  });
}

function readDisplayAndMachineIds() {
  return Promise.all([systemInfo.getDisplayId(), systemInfo.getMachineId()])
}

function init() {
  return readDisplayAndMachineIds().then((values) => {
    const [displayId, machineId] = values;
    return connect(displayId, machineId);
  });
}

function on(topic, handler) {
  const key = topic.toLowerCase();
  if (!messageHandlers[key]) {
    messageHandlers[key] = [];
  }

  messageHandlers[key].push(handler);
}

function send(message) {
  if (!connection) {
    logger.error('messaging - cannot send message to MS, no connection');
    return;
  }

  connection.write(message);
}

module.exports = {
  init,
  on,
  send
}
