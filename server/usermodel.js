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
  DBUSERNOTEXIST: 3,
  DBUSERDUP: 4,
  APIPHONEISEMPTY: 20,
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

};

UserProfileDTO.prototype = {

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

var exeQuery = function (sql, cb) {
  console.log('exeQuery:'+sql);
  var ret = {err: 0};
  var done = function() {
    if (typeof cb === 'function') {
      if (ret.err) {
        cb(ret.err, ret);
      } else {
        cb(0, ret.data);
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


