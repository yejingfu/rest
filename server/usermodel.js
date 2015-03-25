var util = require('./util');
var error = require('./error');
var errCode = error.errCode;

var pool = util.dbPool;

// class UserDTO
var UserDTO = function() {
  this.uid = 0;
  this.phone = '';
  this.status = 0;
  this.upid = 0;
  this.updatedts = 0;
};

UserDTO.prototype = {
  toJSON: function() {
    return {
      uid: this.uid,
      phone: this.phone,
      status: this.status,
      upid: this.upid,
      updatedts: this.updatedts
    };
  },

  fromJSON: function(obj) {
    this.uid = obj.uid || 0;
    this.phone = obj.phone || '';
    this.status = obj.status || 0;
    this.upid = obj.upid || 0;
    this.updatedts = obj.updatedts || 0;
  }
};

// class UserProfileDTO
var UserProfileDTO = function() {
  this.upid = 0;
  this.uid = 0;
  this.nickname = '';
  this.gender = 0;
  this.birthday = '';
  this.signature = '';
  this.hobby = '';
  this.job = '';
  this.edu = '';
  this.favoriteauthor = '';
  this.favoritebook = '';
  this.avatar = '';
  this.updatedts = 0;
};

UserProfileDTO.prototype = {
  toJSON: function() {
    return {
      upid: this.upid,
      uid: this.uid,
      nickname: this.nickname,
      gender: this.gender,
      birthday: this.birthday,
      signature: this.signature,
      hobby: this.hobby,
      job: this.job,
      edu: this.edu,
      favoriteauthor: this.favoriteauthor,
      favoritebook: this.favoritebook,
      avatar: this.avatar,
      updatedts: this.updatedts
    };
  },
  fromJSON: function(obj) {
    this.upid = obj.upid || 0;
    this.uid = obj.uid || 0;
    this.nickname = obj.nickname || '';
    this.gender = obj.gender || 0;
    this.birthday = obj.birthday || '';
    this.signature = obj.signature || '';
    this.hobby = obj.hobby || '';
    this.job = obj.job || '';
    this.edu = obj.edu || '';
    this.favoriteauthor = obj.favoriteauthor || '';
    this.favoritebook = obj.favoritebook || '';
    this.avatar = obj.avatar || '';
    this.updatedts = obj.updatedts || 0;
  }
};

var extractUserDTOFromDB = function(users) {
  var dto = [];
  for (var i = 0, len = users.length; i < len; i++) {
    userDto = new UserDTO();
    userDto.fromJSON(users[i]);
    dto.push(userDto);
  }
  return dto;
};

var extractUserProfileDTOFromDB = function(profile) {
  var profiledto = new UserProfileDTO();
  profiledto.fromJSON(profile);
  return profiledto;
};

var mergeProfile = function(src, dst) {
  src.nickname = dst.nickname || src.nickname;
  src.gender = dst.gender; // || src.gender;
  src.birthday = dst.birthday || src.birthday;
  src.signature = dst.signature || src.signature;
  src.hobby = dst.hobby || src.hobby;
  src.job = dst.job || src.job;
  src.edu = dst.edu || src.edu;
  src.favoriteauthor = dst.favoriteauthor || src.favoriteauthor;
  src.favoritebook = dst.favoritebook || src.favoritebook;
  src.avatar = dst.avatar || src.avatar;
  return src;
};

var exeQuery = function (sql, cb) {
  console.log('exeQuery:'+sql);
  var ret = {err: 0};
  var done = function() {
    if (typeof cb === 'function') {
      if (ret.err) {
        cb(ret.err, ret);
      } else {
        cb(errCode.OK, ret.data);
      }
    }
  };

  pool.getConnection(function(err, conn) {
    if (err) {
      ret = {err: errCode.DBCONN, msg: err};
      done();
    } else {
      conn.query(sql, function(err2, rows) {
        if (err2) {
          ret = {err: errCode.DBQUERY, msg: err2};
        } else {
          ret.data = rows;
        }
        conn.release();
        done();
      });
    }
  });
};

var exeUpdate = function(sql, cb) {
  console.log('exeUpdate:'+sql);
  var ret = {err: 0};
  var done = function() {
    if (typeof cb === 'function') {
      if (ret.err) {
        cb(ret.err, ret);
      } else {
        cb(errCode.OK, ret.data);
      }
    }
  };

  pool.getConnection(function(err, conn) {
    if (err) {
      ret = {err: errCode.DBCONN, msg: err};
      done();
    } else {
      conn.query(sql, function(err2, rows) {
        if (err2) {
          ret = {err: errCode.DBUPDATE, msg: err2};
        } else {
          ret.data = rows;
        }
        conn.release();
        done();
      });
    }
  });
};

exports.errCode = errCode;
exports.UserDTO = UserDTO;
exports.UserProfileDTO = UserProfileDTO;

exports.getUserByPhone = function(phone, cb) {
  var sql = 'select * from user where phone='+phone+' limit 1';
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  exeQuery(sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractUserDTOFromDB(data);
      if (dto.length === 0) {
        ret = {err: errCode.DBUSERNOTEXIST, msg: 'user not exists!'};
      } else if (dto.length > 1) {
        ret = {err: errCode.DBUSERDUP, msg: 'duplicated users!'};
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.user = dto[0].toJSON();
      }
      cb(ret.err, ret);
    }
  });
};

exports.getUserByUID = function(uid, cb) {
  var sql = 'select * from user where uid='+uid+' limit 1';
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  exeQuery(sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractUserDTOFromDB(data);
      if (dto.length === 0) {
        ret = {err: errCode.DBUSERNOTEXIST, msg: 'user not exists!'};
      } else if (dto.length > 1) {
        ret = {err: errCode.DBUSERDUP, msg: 'duplicated users!'};
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.user = dto[0].toJSON();
      }
      cb(ret.err, ret);
    }
  });
};

exports.getProfileByUID = function(uid, cb) {
  var sql = 'select * from user_profile where uid='+uid+' limit 1';
  var profile;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  exeQuery(sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      profile = data.length !== 0 ? extractUserProfileDTOFromDB(data[0]) : undefined;
      if (!profile) {
        ret = {err: errCode.DBUSERPROFILENOTEXIST, msg: 'user profile not exists!'};
      } else {
        //console.log('ddd:'+JSON.stringify(profile.toJSON()));
        ret.profile = profile;
      }
      cb(ret.err, ret);
    }
  });
};

exports.getUserAndProfileByUID = function(uid, cb) {
  exports.getUserByUID(uid, function(err, data) {
    if (err) return cb(err, data);
    exports.getProfileByUID(uid, function(err2, data2) {
      if (err2) return cb(err2, data2);
      cb(0, {user: data.user, profile: data2.profile});
    });
  });
}

exports.getUserBasicInfoByUID = function(uid, cb) {
  var basicInfo = {};
  exports.getUserByUID(uid, function(err, data) {
    if (err) return cb(err, data);
    exports.getProfileByUID(uid, function(err2, data2) {
      if (err2) return cb(err2, data2);
      basicInfo.uid = data.user.uid;
      basicInfo.phone = data.user.phone;
      basicInfo.status = data.user.status;
      basicInfo.nickname = data2.profile.nickname;
      basicInfo.gender = data2.profile.gender;
      basicInfo.birthday = data2.profile.birthday;
      basicInfo.signature = data2.profile.signature;
      basicInfo.hobby = data2.profile.hobby;
      basicInfo.job = data2.profile.job;
      basicInfo.edu = data2.profile.edu;
      basicInfo.favoriteauthor = data2.profile.favoriteauthor;
      basicInfo.favoritebook = data2.profile.favoritebook;
      basicInfo.avatar = data2.profile.avatar;
      cb(0, basicInfo);
    });
  });
};

exports.getAllUsers = function(cb) {
  var ret = {err: 0};
  var sql = 'select * from user';
  var done = function() {
    if (typeof cb === 'function') {
      cb(ret.err, ret);
    }
  };

  pool.getConnection(function(err, conn){
    if (err) {
      ret = {err: errCode.DBCONN, msg: err};
      done();
    } else {
      conn.query(sql, function(err2, rows) {
        if (err2) {
          ret = {err: errCode.DBQUERY, msg: err2};
        } else {
          //util.printUserList(rows);
          var dto = extractUserDTOFromDB(rows);
          ret.users = [];
          for (var i = 0, len = dto.length; i < len; i++) {
            ret.users.push(dto[i].toJSON());
          }
        }
        conn.release();
        done();
      });
    }
  });
};

exports.addNewUser = function(user, profile, cb) {
  if (typeof cb !== 'function') return;
  var ret = {err: errCode.OK, msg: ''};
  if (user.phone === '' || user.pwd === '') {
    ret.err = errCode.APIPHONEORPWDISEMPTY;
    ret.msg = 'Phone or password is empty';
    cb(ret.err, ret);
    return;
  }
  user.status = user.status || 0;
  var ts = util.now();
  var sql = 'insert into user(phone, pwd, status, createdts, updatedts) values("'+
            user.phone+'","'+user.pwd+'","'+user.status+'","'+ts+'","'+ts+'")';
  exeUpdate(sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBFAILEDADDUSER;
      ret.msg = 'Failed to add user: ' + data.msg;
      cb(ret.err, ret);
    } else {
      exports.getUserByPhone(user.phone, function(err2, data2){
        if (err2 || !data2.user || data2.user.uid === 0) {
          ret.err = errCode.DBFAILEDGETUSER;
          ret.msg = 'Failed to get user';
          cb(ret.err, ret);
        } else {
          ret.user = data2.user;
          profile.uid = ret.user.uid;
          addNewProfile(profile, function(err3, data3){
            if (err3) {
              // revert the added user
              deleteUserByID(profile.uid, function() {
                ret.err = errCode.DBFAILEDADDPROFILE;
                ret.msg = 'Failed to add profile: ' + data3.msg;
                cb(ret.err, ret);
              });
            } else {
              ret.profile = data3.profile;
              cb(ret.errCode, ret);
            }
          });
        }
      });
    }
  });
};

exports.updateUser = function(phone, pwd, status, cb) {
  var ret;
  if (!phone) {
    ret = {err:errCode.APIPHONEISEMPTY, msg:'the user phone is empty'}
    cb(ret.err, ret);
    return;
  }
  var sql;
  if (pwd) {
    sql = 'update user set pwd="'+pwd+'"';
  }
  if (!isNaN(status)) {
    sql = 'update user set status="'+status+'"';
  }
  if (pwd && !isNaN(status)) {
    sql = 'update user set pwd="'+pwd+'", status="'+status+'"';
  }
  sql += ', updatedts="'+(util.now()+2)+'" where phone="'+phone+'" limit 1';
  exeUpdate(sql, function(err, data) {
    if (err) {
      ret = {err: errCode.DBFAILEDUPDATEUSER, msg: 'Failed to update user'};
    } else {
      ret = {err: errCode.OK, msg: 'Success to update user'};    
    }
    cb(ret.err, ret);
  });
};

exports.updateUserProfile = function(uid, profile, cb) {
  var ts = util.now();
  var ret;
  var dstProfile = profile;
  console.log('updateUserProfile');
  exports.getProfileByUID(uid, function(err, data){
    if (err) {
      cb(err, data);
    } else {
      var srcProfile = data.profile;
      //console.log('dd--'+srcProfile + '--'+dstProfile);
      profile = mergeProfile(srcProfile, dstProfile);

      var sql = 'update user_profile set nickname="'+profile.nickname+'", gender="'+profile.gender+'", birthday="'+profile.birthday+'", signature="'+profile.signature+'", hobby="'+profile.hobby+'", job="'+profile.job+'", edu="'+profile.edu+'", favoriteauthor="'+profile.favoriteauthor+'", favoritebook="'+profile.favoritebook+'", avatar="'+profile.avatar+'", updatedts="'+ts+'" where uid="'+uid+'" limit 1';
      exeUpdate(sql, function(err, data) {
        if (err) {
          ret = {err: errCode.DBFAILEDUPDATEPROFILE, msg: 'Failed to update user profile'};
        } else {
          ret = {err: errCode.OK, msg: 'Success to update user profile'};    
        }
        cb(err, ret);
      });
    }
  });
};

var addNewProfile = function(profile, cb) {
  var ts = util.now();
  var ret;
  var prefix = 'insert into user_profile(uid';
  var suffix = ' values("'+profile.uid+'"';
  if (profile.nickname) {
    prefix += ', nickname';
    suffix += ', "'+profile.nickname + '"';
  }
  if (!isNaN(profile.gender)) {
    prefix += ', gender';
    suffix += ', "'+profile.gender + '"';
  }
  if (profile.birthday) {
    prefix += ', birthday';
    suffix += ', "'+profile.birthday + '"';
  }
  if (profile.signature) {
    prefix += ', signature';
    suffix += ', "'+profile.signature + '"';
  }
  if (profile.hobby) {
    prefix += ', hobby';
    suffix += ', "'+profile.hobby + '"';
  }
  if (profile.job) {
    prefix += ', job';
    suffix += ', "'+profile.job + '"';
  }
  if (profile.edu) {
    prefix += ', edu';
    suffix += ', "'+profile.edu + '"';
  }
  if (profile.favoriteauthor) {
    prefix += ', favoriteauthor';
    suffix += ', "'+profile.favoriteauthor + '"';
  }
  if (profile.favoritebook) {
    prefix += ', favoritebook';
    suffix += ', "'+profile.favoritebook + '"';
  }
  if (profile.avatar) {
    prefix += ', avatar';
    suffix += ', "'+profile.avatar + '"';
  }
  prefix += ', createdts, updatedts)';
  suffix += ',"'+ts+'","' + ts + '")';

  var sql = prefix + suffix;


  exeUpdate(sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBFAILEDADDPROFILE;
      ret.msg = 'Failed to add user: ' + data.msg;
      cb(ret.err, ret);
    } else {
      exports.getProfileByUID(profile.uid, function(err2, data2){
        if (err2) {
          ret.err = errCode.DBFAILEDADDPROFILE;
          ret.msg = 'Failed to add user: ' + data2.msg;
          cb(ret.err, ret);
        } else {
          ret = {err:errCode.OK, profile: data2.profile};
          cb(ret.err, ret);
        }
      });
    }
  });
};

var deleteUserByID = function(uid, cb) {
  var sql = 'delete from user where uid="'+uid+'"';
  exeUpdate(sql, function(err, data) {
    cb(err, data);
  });
};


exports.getFriendIDList = function(uid, count, cb) {
  var sql = 'select * from friends where uid = '+uid+' order by updatedts desc limit ' + count;
  var i, len, row;
  var friends = [];
  exeQuery(sql, function(err, data) {
    if (err) return cb(err, data);
    for ( i = 0, len = data.length; i < len; i++) {
      row = data[i];
      // friendId, rename, updated_ts
      friends.push([row.friendid, row.rename, row.updatedts]);
    }
    cb(0, {friends: friends});
  });
};

exports.getSessionID = function(fromId, toId, cb) {
  var small = fromId;
  var large = toId;
  var row;
  if (fromId > toId) {
    small = toId;
    large = fromId;
  }
  var sql = 'select * from friendship where smallid='+small+' and largeid='+large+' limit 1';
  exeQuery(sql, function(err, data) {
    if (err) return cb(err, data);
    row = data[0];
    cb(0, row.relateid);
  });
};

var fetchMessagesBySQL = function(sql, cb) {
  // list of message [mid, relateid, fromuid, touid, content, status, createdts]
  var messages = [], i, len, row;
  exeQuery(sql, function(err, data){
    if (err) return cb(err, data);
    for (i = 0, len = data.length; i < len; i++) {
      row = data[i];
      messages.push([row.mid, row.relateid, row.fromuid, row.touid, row.content, row.status, row.createdts]);
    }
    cb(0, messages);
  });
};

exports.getUnreadMessagesByUserID = function(uid, cb) {
  var sql = 'select * from message where (fromuid='+uid+' or touid='+uid+') and status=0 limit 5000';
  fetchMessagesBySQL(sql, cb);
};

exports.getUnreadMessagesBySessionID = function(sid, cb) {
  var sql = 'select * from message where relateid='+sid+' and status=0 limit 5000';
  fetchMessagesBySQL(sql, cb);
};

exports.clearUnReadMessagesBySessionID = function(sid, cb) {
  var sql = 'update message set status=1 where relateid='+sid;
  exeQuery(sql, function(err, data){
    return cb(err, data);
  });
};

exports.getGroupInfoByUserID = function(uid, cb) {
  var sql = 'select touid from message where fromuid='+uid+' order by createdts desc limit 10000';
  var groupIds = {}, grp, keys;
  var i, len, gid;
  var ret = {err: 0, msg: '', groups: []};
  exeQuery(sql, function(err, data) {
    if (err) return cb(err, data);
    for (i = 0, len = data.length; i < len; i++) {
      gid = data[i].touid;
      if (gid > 10000 && groupIds[gid] === undefined) {
        groupIds[gid] = true;
      }
    }
    keys = Object.keys(groupIds);
    if (keys.length === 0) {
      return cb(0, ret);
    }
    sql = 'select * from bkgroup where gid in(';
    for (i = 0, len = keys.length-1; i < len; i++) {
      sql += keys[i]+',';
    }
    sql += keys[len]+')';
    exeQuery(sql, function(err2, data2){
      if (err2) return cb(err2, data2);
      for (i = 0, len = data2.length; i < len; i++) {
        grp = data2[i];
        ret.groups.push([grp.gid, grp.name, grp.content, grp.grptype, grp.owner, grp.bid]);
      }
      return cb(0, ret);
    });
  });
};

exports.getFeedbacks = function(uid, cb) {
  var sql;
  var ret = {err: 0, msg: '', feedbacks: []};
  var i, len, row;
  if (uid && uid != 0) {
    sql = 'select * from feedback where uid='+uid;
  } else {
    sql = 'select * from feedback';
  }
  sql += ' order by createdts desc limit 1000';

  exeQuery(sql, function(err, data) {
    if (err) return cb(err, data);
    for (i = 0, len = data.length; i < len; i++) {
      row = data[i];
      ret.feedbacks.push([row.id, row.uid, row.content, row.createdts]);
    }
    cb(0, ret);
  });
};
