'use strict';
const common = require('../common');
const assert = require('assert');
const fork = require('child_process').fork;
const net = require('net');

if (process.argv[2] === 'child') {

  process.on('message', (msg, socket) => {
    socket.end('goodbye');
  });

  process.send('hello');

} else {

  const child = fork(process.argv[1], ['child']);

  const runTest = common.mustCall(() => {

    const server = net.createServer();

    // server connection count should start at 0
    assert.strictEqual(server.getConnections(), 0);
    server.on('connection', (socket) => {
      child.send({ what: 'socket' }, socket);
    });
    server.on('close', () => {
      child.kill();
    });

    server.listen(0, common.mustCall(() => {
      const connect = net.connect(server.address().port);

      connect.on('close', common.mustCall(() => {
        // now server connection count should be null
        assert.strictEqual(server.getConnections(), null);
        server.close();
      }));

      connect.resume();
    }));
  });

  child.on('message', runTest);
}
