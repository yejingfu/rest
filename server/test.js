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

var testString2Buffer = function(cb) {
  var ret = {err: 0, msg: 'Okay'};
  var str = 'Hello 上海';
  var len = str.length;
  var buf = new ArrayBuffer(len*2, 0);

  view = new DataView(buf, 0);
  for (var i = 0; i < len; i++) {
    view.setUint16(i * 2, str.charCodeAt(i));
  }  

  /** print
  view = new DataView(buf, 0);
  for (var i = 0; i < len*2; i++) {
    var code = view.getUint8(i);
    console.log('charCodeAt['+i+']:' + code);
  }
  */
  
  // buffer to string
  
  packet.realignv2(buf, 0, 2, len*2);
  
  /* print
  view = new DataView(buf, 0);
  for (var i = 0; i < len*2; i++) {
    var code = view.getUint8(i);
    console.log('charCodeAt2['+i+']:' + code);
  }
  */
  
  view = new Uint16Array(buf, 0, len);
  for (var i = 0; i < len; i++) {
    console.log('u16['+i+']:'+view[i]);
  }
  var str2 = String.fromCharCode.apply(null, view);
  console.log('str2:'+str2);
  
  //
  console.log('test again');
  var buf2 = new ArrayBuffer(4 + len * 2, 0);
  console.log('jeff 1');
  packet.str2buf(buf2, 0, str);
  console.log('jeff 2');
  str2 = packet.buf2str(buf2, 0);
  console.log('str2:'+str2);
  
  //
  console.log('test again and again');
  var str3 = 'Hello World';
  var len3 = str3.length;
  var buf3 = new ArrayBuffer(4 + len3, 0);
  console.log('jeff 1');
  packet.multichar2buf(buf3, 0, str3);
  console.log('jeff 2');
  str3 = packet.buf2multichar(buf3, 0);
  console.log('str3:'+str3);
  
  cb(ret);
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
  } else if (target === 'str2buf') {
    testString2Buffer(function(data) {
      res.end(JSON.stringify(data));
    });
  }
};

