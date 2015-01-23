/** construct a packet like below:
*   --------------------
*   | length (int32)   |
*   | service (int16)  |
*   | command (int16)  |
*   | version (int16)  |
*   | reserved (int16) |
*   --------------------
*
*/

var HEAD_SIZE = 12;

///
/// Utilities
///

var realign = function(buf, offset, size) {
  var view = new DataView(buf, offset);
  var t;
  for (var i = 0; i < size / 2; i++) {
    t = view.getUint8(i);
    view.setUint8(i, view.getUint8(size - i - 1));
    view.setUint8(size - i - 1, t);
  }
}

var buf2str = function(buf, offset) {
  offset = offset || 0;
  var view = new DataView(buf, offset);
  var len = view.getInt32(0);
  //console.log('buf2str len:'+len);
  view = new Uint16Array(buf, offset + 4, len/2);
  var str = String.fromCharCode.apply(null, view);
  return str;
}

var str2buf = function(buf, offset, str) {
 // 2 bytes per charactor
  var len = str.length;
  //console.log('str2buf.length:'+len);
  var view = new DataView(buf, offset);
  view.setInt32(0, len*2);
  
  view = new Uint16Array(buf, offset + 4);
  for (var i = 0; i < len * 2; i++) {
    //view.setUint16(4 + i * 2, str.charCodeAt(i));
    view[i] = str.charCodeAt(i);
  }
  return buf;
}
function buf2strv2(buf) {
  var view = new Uint16Array(buf, 0, 11);
  var str = String.fromCharCode.apply(null, view);
  return str;
}

function str2bufv2(str) {
  var len = str.length * 2;  // 2 bytes per charactor
  var buf = new ArrayBuffer(len);
  var view = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buf;
}

var appendBuffer = function(buf1, buf2, offset) {
  var view1 = new DataView(buf1, offset);
  var view2 = new DataView(buf2);
  var len = view2.byteLength;
  if (view1.byteLength < len) {
    return false;
  }
  for (var i = 0; i < len; i++) {
    view1.setUint8(i, view2.getUint8(i));
  }
  return true;
}

///
/// Header
///
var buildPacketHeader = function(len, sid, cid) {
  //if (len % 4 !== 0) {
  //  len += (4 - len % 4);
  //}
  var buf = new ArrayBuffer(len, 0);
  
  /* Bad: should re-align the byte array!!!
  var int32view = new Int32Array(buf);
  var int16view = new Int16Array(buf);
  int32view[0] = len;
  int16view[2] = sid;
  int16view[3] = cid;
  int16view[4] = 1;
  realign(buf, 0, 4);
  realign(buf, 4, 2);
  realign(buf, 6, 2);
  realign(buf, 8, 2);
  realign(buf, 10, 2);
  */
  
  // Good
  var view = new DataView(buf);
  view.setInt32(0, len);
  view.setInt16(4, sid);
  view.setInt16(6, cid);
  view.setInt16(8, 1);
  view.setInt16(10, 0);
  
  return buf;
}

var parsePacketHeader = function(headerBuf) {
/*
  var int32view = new Int32Array(headerBuf);
  var int16view = new Int16Array(headerBuf);
  var ret = {};
  ret.len = int32view[0];
  ret.sid = int16view[2];
  ret.cid = int16view[3];
  ret.version = int16view[4];
  ret.reserved = 0;
  return ret;
  */
  
  var view = new DataView(headerBuf);
  var ret = {};
  ret.len = view.getInt32(0);
  ret.sid = view.getInt16(4);
  ret.cid = view.getInt16(6);
  ret.version = view.getInt16(8);
  ret.reserved = view.getInt16(10);
  return ret;
}

var testHeader = function() {
  var header = buildPacketHeader(32, 2, 6);
  if (header) {
    var ret = parsePacketHeader(header);
    console.log('Header:' + JSON.stringify(ret));
  } else {
    console.log('Failed');
  }
}

///
/// Echo
///
var buildEchoPacket = function() {
/** test
  var str = 'Hello WOrld';  
  var strLen = str.length;
  var tmpBuf = new ArrayBuffer(strLen * 2 + 4, 0);
  str2buf(tmpBuf, 0, str);
  str = buf2str(tmpBuf, 0);
  console.log('test str2buf:'+str);
*/
  var magic = 458928;
  var msg = 'Hello World';
  var msgLen = msg.length;
  var bufLen = HEAD_SIZE + 4 + 4 + msgLen*2;
  var buf = buildPacketHeader(bufLen, 1, 12);
  var view = new DataView(buf, HEAD_SIZE);
  view.setInt32(0, magic);
  str2buf(buf, HEAD_SIZE + 4, msg);
  return buf;
}

var parseEchoPacket = function(buf) {
  var ret = parsePacketHeader(buf);
  var view = new DataView(buf, HEAD_SIZE);
  ret.magic = view.getInt32(0);
  ret.msg = buf2str(buf, HEAD_SIZE + 4);
  return ret;
}

var testEchoPacket = function() {
  var buf = buildEchoPacket();
  if (!buf) {
    console.log('Failed to build echo packet');
    return;
  }
  var ret = parseEchoPacket(buf);
  console.log('echo packet: ' + JSON.stringify(ret));
}

exports.buildEchoPacket = buildEchoPacket;
exports.parseEchoPacket = parseEchoPacket;




