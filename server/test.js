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

  var buf = packet.buildEchoPacket();
  var buf2 = util.convertArrayBufferToBuffer(buf);
        console.log('data len:'+buf2.length);
  //var bufstream = new util.BufferStream(buf2);
  cb(util.convertBufferToArrayBuffer(buf2));
  return;
  */
  
  var received = false;
  var data;
  var conn = net.connect({
    port: 8740,
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
    //util.printObject(data);
    console.log('data: ' + chuck.toString());
    console.log('data len:' + chuck.length + '--'+chuck.readInt32BE(0));

    //console.log('data: ' + data.toString());
    //conn.end();
    received = true;
    data = chuck;
    //cb(data);
  });

  conn.on('end', function() {
    console.log('connection disconnected');
    if (!received) {
      cb('Failed to receive data to 121.199.58.239');
    } else {
      var ab = util.convertBufferToArrayBuffer(data);
      cb(ab);
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
    testEcho(function(data) {
      var ret = packet.parseEchoPacket(data);
      res.end(JSON.stringify(ret));
    });
  }
};

