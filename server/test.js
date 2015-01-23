var net = require('net');
var um = require('./usermodel');
var util = require('./util');
var packet = require('./packet');

//util.printObject(net, 'net');

var testEcho = function(cb) {
  var received = false;
  var conn = net.connect({
    port: 8740,
    host: '121.199.58.239'
  }, function() { // get connected
    console.log('connect to server 121.199.58.239');
    var buf = packet.buildEchoPacket();
    var bufstream = new util.BufferStream(util.convertArrayBufferToBuffer(buf));
    bufstream.pipe(conn);
    //conn.write(buf);
  });

  conn.on('data', function(data) {
    console.log('client received data from server');
    console.log('data: ' + data.toString());
    conn.end();
    received = true;
    cb(data);
  });

  conn.on('end', function() {
    console.log('connection disconnected');
    if (!received) {
      cb('Failed to receive data to 121.199.58.239');
    }
  });
};

exports.run = function(req, res, next) {
  var target = req.params.target;
  if (target === 'echo') {
    testEcho(function(data) {
      res.end(data);
    });
  }
};

