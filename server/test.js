var net = require('net');
var um = require('./usermodel');
var util = require('./util');
var packet = require('./packet');

var errCode = {
  E_FAILED_ECHO: 1
};

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

  var buf = packet.buildEchoPacket();
  var buf2 = util.convertArrayBufferToBuffer(buf);
        console.log('data len:'+buf2.length);
  //var bufstream = new util.BufferStream(buf2);
  cb(util.convertBufferToArrayBuffer(buf2));
  return;
  */
  
  var received = false;
  var conn = net.connect({
    port: 8640,
    host: '121.199.58.239'
  }, function() { // get connected
    console.log('connect to server 121.199.58.239');
    var buf = packet.buildEchoPacket();
    var buf2 = util.convertArrayBufferToBuffer(buf);
    conn.write(buf2);
    
    //var bufstream = new util.BufferStream(util.convertArrayBufferToBuffer(buf));
    //bufstream.pipe(conn);
  });

  conn.on('data', function(chuck) {
    console.log('client received data from server');
    received = true;
    cb(0, util.convertBufferToArrayBuffer(chuck));
    conn.end();
  });

  conn.on('end', function() {
    console.log('connection disconnected');
    if (!received) {
      cb(1, {err: errCode.E_FAILED_ECHO, msg: 'Failed to receive data from 121.199.58.239'});
    }
  });
  
  conn.on('error', function(err) {
    console.log('error occurs: '+ err);
  });
};

exports.run = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var target = req.params.target;
  if (target === 'echo') {
    testEcho(function(err, data) {
      if (err) {
        res.end(JSON.stringify(data));
      } else {
        var ret = packet.parseEchoPacket(data);
        res.end(JSON.stringify(ret));
      }
    });
  }
};

