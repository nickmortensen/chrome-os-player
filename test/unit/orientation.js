const sinon = require('sinon');
const logger = require('../../src/logging/logger');

const orientation = require('../../src/orientation');

const sandbox = sinon.createSandbox();

describe('Orientation', () => {

  afterEach(() => chrome.flush());

  afterEach(() => sandbox.restore());

  beforeEach(() => sandbox.stub(logger, 'log'));

  it('should rotate', () => {
    chrome.system.display.getInfo.yields([{id: "id", rotation: 0}]);

    orientation.setupOrientation({display: {orientation: 90}});

    sinon.assert.calledWith(chrome.system.display.setDisplayProperties, "id", {rotation: 90});
    sinon.assert.calledWith(logger.log, `changing orientation from 0 to 90`);
  });

  it('should not rotate if equal', () => {
    chrome.system.display.getInfo.yields([{id: "id", rotation: 90}]);

    orientation.setupOrientation({display: {orientation: 90}});

    sinon.assert.notCalled(chrome.system.display.setDisplayProperties);
  });

  it('should sanitize orientation', () => {
    chrome.system.display.getInfo.yields([{id: "id", rotation: 0}]);

    orientation.setupOrientation({display: {orientation: 450}});

    sinon.assert.calledWith(chrome.system.display.setDisplayProperties, "id", {rotation: 90});
    sinon.assert.calledWith(logger.log, `changing orientation from 0 to 90`);
  });
});
