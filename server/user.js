var um = require('./usermodel');
var util = require('./util');


////////////////////////////
/// RESTful API handlers
////////////////////////////

exports.handle = function(req, res, next) {
  console.log('['+req.method+']: ' + req.params.phone);
  res.setHeader('Content-Type', 'text/json');
  var phone = req.params.phone;
  var ret = {err: 0};
  if (!phone) {
    ret = {err:um.errCode.APIPHONEISEMPTY, msg: 'The phone is empty'};
    res.end(JSON.stringify(ret));
    next();
    return;
  }

  if (req.method === 'GET') {
    //util.printReqHeaders(req);
    um.getUserByPhone(phone, function(err, data) {
      res.end(JSON.stringify(data));
      next();
    });
  } else if (req.method === 'POST') {
    //util.printReqBody(req);
  }  else if (req.method === 'PUT') {
    //util.printReqBody(req);
  }  else if (req.method === 'DELETE') {
    //util.printReqHeaders(req);
    //util.printReqBody(req);
  } else {
    res.end(JSON.stringify(ret));
    next();
  }
};

exports.list = function(req, res, next) {
  console.log('['+req.method+']: list users');
  res.setHeader('Content-Type', 'text/json');

  um.getAllUsers(function(err, ret) {
    if (err) {
      console.error('Failed to get all users: ' + err + '--' + ret.msg);
    }
    res.end(JSON.stringify(ret));
    next();
  });

};

