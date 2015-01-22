var util = require('./util');

var mysql = require('mysql');
console.log('create mysql pool...');
var pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'booker'
});

var errCode = {
  OK: 0,
  DBCONN: 1,
  DBQUERY: 2,
  DBUPDATE:3,
  DBUSERNOTEXIST: 12,
  DBUSERPROFILENOTEXIST: 13,
  DBUSERDUP: 14,
  DBFAILEDADDUSER: 15,
  DBFAILEDADDPROFILE: 16,
  DBFAILEDGETUSER: 17,
  DBFAILEDUPDATEUSER: 18,
  DBFAILEDUPDATEPROFILE:19,
  DBFAILEDGETPROFILE:20,
  APIUSERIDISEMPTY:40,
  APIPHONEISEMPTY: 41,
  APIPWDISEMPTY: 42,
  APIPHONEORPWDISEMPTY: 43,
  UNKNOWN:100
};

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
  src.gender = dst.gender || src.gender;
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
        console.log('ddd:'+JSON.stringify(profile.toJSON()));
        ret.profile = profile;
      }
      cb(ret.err, ret);
    }
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
      console.log('dd--'+srcProfile + '--'+dstProfile);
      profile = mergeProfile(srcProfile, dstProfile);

      var sql = 'update user_profile set nickname="'+profile.nickname+'", gender="'+profile.gender+'", birthday="'+profile.birthday+'", signature="'+profile.signature+'", hobby="'+profile.hobby+'", job="'+profile.job+'", edu="'+profile.edu+'", favoriteauthor="'+profile.favoriteauthor+'", favoritebook="'+profile.favoritebook+'", avatar="'+profile.avatar+'", updatedts="'+ts+'" where uid="'+uid+'" limit 1';
      exeUpdate(sql, function(err, data) {
        //cb(err, data);
        if (err) {
          ret = {err: errCode.DBFAILEDUPDATEPROFILE, msg: 'Failed to update user profile'};
        } else {
          ret = {err: errCode.OK, msg: 'Success to update user profile'};    
        }
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
