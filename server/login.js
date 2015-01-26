var util = require('./util');
var packet = require('./packet');

exports.register = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var phone = req.body.phone;
  var pwd = req.body.pwd;
  var checkcode = req.body.checkcode;
  var status = req.body.status || 0;
  var clientType = req.body.clienttype || 1;
  var clientVersion = req.body.clientversion || '0.0.1';
  
  var ret = {err: 1, msg: 'Lack of some parameters'};
  
  if (!phone || !pwd || !checkcode) return res.end(JSON.stringify(ret));
  var chkCodeBuf = packet.buildCheckCodePacket(phone);
  var registerBuf = packet.buildRegisterReqPacket(phone, pwd, checkcode, status, clientType, clientVersion);
  var conn;
  util.connectToServer(function(conn_) {
    conn = conn_;
    conn.write(util.convertArrayBufferToBuffer(chkCodeBuf));
  }, function(data) {
    buf = util.convertBufferToArrayBuffer(data);
    ret = packet.parsePacketHeader(buf);
    if (!ret) {
      ret = {err: 1, msg:'unknown error about request checkcode'};
      res.end(JSON.stringify(ret));
      conn.end();
      return;
    }
    if (ret.sid === 1 && ret.cid === 17) {
      console.log('receive CID_BOOKER_CHK_CODE_RES...');
      ret = packet.parseCheckCodeResPacket(buf);
      console.log('CID_BOOKER_CHK_CODE_RES: '+ JSON.stringify(ret));
      if (ret.result === 0) {
        conn.write(util.convertArrayBufferToBuffer(registerBuf));
      } else {
        ret = {err: ret.result, msg: 'Failed to request checkcode!'};
        res.end(JSON.stringify(ret));
      }
    } else if (ret.sid === 1 && ret.cid === 19) {
      console.log('receive CID_BOOKER_REGISTER_RES...');
      ret = packet.parseRegisterResPacket(buf);
      res.end(JSON.stringify(ret));
      conn.end();
    }
  });
};

exports.sendCheckCode = function(req, res, next) {

};

exports.login = function(req, res, next) {
  
};
