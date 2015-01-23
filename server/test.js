var net = require('net');
var um = require('./usermodel');
var util = require('./util');
var packet = require('./packet');

//util.printObject(net, 'net');

var testEcho = function(cb) {
    /** test
    var buf = packet.buildEchoPacket();
    var view = new DataView(buf);
    var view2 = new Int32Array(buf);
    view2[0] = 0x01020304;
    for (var i = 0; i < 4; i++) {
      console.log('no '+i+':'+view.getUint8(i));
    }
    cb('OK');
    return;
    */
console.log('jeff 1');
    var buf = packet.buildEchoPacket();
console.log('jeff 2');
    var buf2 = util.convertArrayBufferToBuffer(buf);
console.log('jeff 2.1');
    var bufstream = new util.BufferStream(buf2);
console.log('jeff 3');
  var received = false;
  var conn = net.connect({
    port: 8640,
    host: '121.199.58.239'
  }, function() { // get connected
    console.log('connect to server 121.199.58.239');
    //var buf = packet.buildEchoPacket();

    //var bufstream = new util.BufferStream(util.convertArrayBufferToBuffer(buf));
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

