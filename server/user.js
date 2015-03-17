var um = require('./usermodel');
var util = require('./util');
var errCode = require('./error').errCode;


////////////////////////////
/// RESTful API handlers
////////////////////////////

var parseUserFromRequest = function(req) {
  var userdto = new um.UserDTO();
  userdto.uid = req.body.uid || 0;
  userdto.phone = req.body.phone;
  userdto.pwd = req.body.pwd;
  userdto.status = parseInt(req.body.status);
  return userdto;
};

var parseProfileFromRequest = function(req) {
  var profiledto = new um.UserProfileDTO();
  profiledto.uid = req.body.uid;
  profiledto.nickname = req.body.nickname;
  profiledto.gender = parseInt(req.body.gender) || 0;
  profiledto.birthday = req.body.birthday;
  profiledto.signature = req.body.signature;
  profiledto.hobby = req.body.hobby;
  profiledto.job = req.body.job;
  profiledto.edu = req.body.edu;
  profiledto.favoriteauthor = req.body.favoriteauthor;
  profiledto.favoritebook = req.body.favoritebook;
  profiledto.avatar = req.body.avatar;
  return profiledto;
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
    user.phone = phone;
    var profile = parseProfileFromRequest(req);
    //console.log('[post]user:'+JSON.stringify(user.toJSON()));
    //res.end(JSON.stringify(user.toJSON()));
    //next();
    um.addNewUser(user, profile, function(err, data) {
      res.end(JSON.stringify(data));
      next();
    });
  }  else if (req.method === 'PUT') {
    //util.printReqBody(req);
    // update user password or status
    var pwd = req.body.pwd;
    var status = req.body.status;
    um.updateUser(phone, pwd, status, function(err, data) {
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

exports.getFriendList = function(req, res, next) {
  // output: [[friendId, rename, updated_ts, phone, nickname, avatar, gender, signature, birthday, hobby, job, edu, fav_book, fav_author]]
  res.setHeader('Content-Type', 'text/json');
  var uid = req.params.uid;
  var result = {err: 0, friends: [], msg: ''};
  var i, len, friends, fi, fpi, count, j, len2, f;
  var friendInfoMap = {};
  var onDone = function() {
    for (j = 0, len2 = friends.length; j < len2; j++) {
      f = friends[j];
      fi = friendInfoMap[f[0]];
      if (!fi) {
        result.err = errCode.DBFRIENDLIST;
        result.msg = 'Failed to get friend information: ' + f[0];
        return res.end(JSON.stringify(result));
      }
      fpi = fi.profile;
      result.friends.push([f[0], f[1], f[2], fi.user.phone, fpi.nickname, fpi.avatar, fpi.gender, fpi.signature, fpi.birthday, fpi.hobby, fpi.job, fpi.edu, fpi.favoritebook, fpi.favoriteauthor]);
    }
    return res.end(JSON.stringify(result));
  };

  if (!uid) {
    result.err = errCode.APIUSERIDISEMPTY;
    result.msg = 'Failed to get friend list because of empty uid';
    return res.end(JSON.stringify(result));
  }
  um.getFriendIDList(uid, 500, function(err, data) {
    if (err || !data || data.friends === undefined) {
      return res.end(JSON.stringify(data));
    }
    count = 0;
    friends = data.friends;
    for (i = 0, len = friends.length; i < len; i++) {
        um.getUserAndProfileByUID(friends[i][0], function(err2, data2) {
          count++;
          if (!err2) {
            friendInfoMap[data2.user.uid] = data2;
          }
          if (count === len) {
            onDone();
            return;
          }
        });
    }
  });
};

exports.getUnreadMessage = function (req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var uid = req.params.uid;
  var friendid = req.params.friendid;
  var ret = {err: 0, msg: ''};
  if (!uid || !friendid) {
    ret.err = errCode.APIPARAMSMISSING;
    ret.msg = 'Invalid uid or friendid';
    return res.end(JSON.stringify(ret));
  }
  um.getSessionID(uid, friendid, function(err, data) {
    if (err) return res.end(JSON.stringify(data));
    um.getUnreadMessagesBySessionID(data, function(err2, data2){
      if (err2) return res.end(JSON.stringify(data2));
      ret.uid = uid;
      ret.relateid = data;
      ret.messages = data2;
      return res.end(JSON.stringify(ret));
    });
  });
};

exports.clearUnReadMessage = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var uid = req.params.uid;
  var sessionid = req.params.relateid;
  var ret = {err: 0, msg: ''};
  if (!uid || !sessionid) {
    ret.err = errCode.APIPARAMSMISSING;
    ret.msg = 'Invalid uid or sessionid';
    return res.end(JSON.stringify(ret));
  }
  um.clearUnReadMessagesBySessionID(sessionid, function(err, data) {
    ret.err = err;
    ret.msg = JSON.stringify(data);
    res.end(JSON.stringify(ret));
  });
};

exports.getGroups = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var uid = req.params.uid;
  var ret = {err: 0, msg: ''};
  if (!uid) {
    ret.err = errCode.APIPARAMSMISSING;
    ret.msg = 'Invalid uid or sessionid';
    return res.end(JSON.stringify(ret));
  }
  um.getGroupInfoByUserID(uid, function(err, data) {
    return res.end(JSON.stringify(data));
  });
};


