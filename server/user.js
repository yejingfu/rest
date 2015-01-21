var um = require('./usermodel');
var util = require('./util');


////////////////////////////
/// RESTful API handlers
////////////////////////////

var parseUserFromRequest = function(req) {
  var userdto = new um.UserDTO();
  userdto.uid = req.body.uid || 0;
  userdto.phone = req.body.phone;
  userdto.pwd = req.body.pwd;
  userdto.status = req.body.status;
  return userdto;
};

var parseProfileFromRequest = function(req) {
  var profiledto = new um.UserProfileDTO();
  profiledto.uid = req.body.uid;
  profiledto.nickname = req.body.nickname;
  profiledto.gender = parseInt(req.body.gender);
  profiledto.birthday = req.body.birthday;
  profiledto.signature = req.body.signature;
  profiledto.hobby = req.body.hobby;
  profiledto.job = req.body.job;
  profiledto.edu = req.body.edu;
  profiledto.favoriteauthor = req.body.favoriteauthor;
  profiledto.favoritebook = req.body.favoritebook;
  profiledto.avatar = req.body.avatar;
};

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
    var user = parseUserFromRequest(req);
    var profile = parseProfileFromRequest(req);
    um.addNewUser(user, profile, function(err, data) {
      res.end(JSON.stringify(data));
      next();
    });
  }  else if (req.method === 'PUT') {
    //util.printReqBody(req);
    // update user password or status
    var uid = req.body.uid;
    var pwd = req.body.pwd;
    var status = req.body.status;
    um.updateUser(uid, pwd, status, function(err, data) {
      res.end(JSON.stringify(data));
      next();
    });
  }  else if (req.method === 'DELETE') {
    //util.printReqHeaders(req);
    //util.printReqBody(req);
    next();
  } else {
    res.end(JSON.stringify(ret));
    next();
  }
};

exports.getProfile = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var uid = req.params.uid;
  um.getProfileByUID(uid, function(err, data) {
    res.end(JSON.stringify(data));
    next();
  });
};

exports.setProfile = function(req, res, next) {
   res.setHeader('Content-Type', 'text/json');
   var uid = req.params.uid;
   var profile = parseProfileFromRequest(req);
   um.updateUserProfile(uid, profile, function(err, data) {
     res.end(JSON.stringify(data));
     next();
   });
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

