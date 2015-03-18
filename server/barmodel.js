// bar model
var util = require('./util');
var error = require('./error');
var errCode = error.errCode;
var um = require('./usermodel');

var pool = util.dbPool;

var BarDTO = function() {
  this.bid = 0;
  this.bname = '';
  this.tel = '';
  this.address = '';
  this.descr = '';  // desc is key word in DB
  this.latitude = 0;
  this.longitude = 0;
  this.district = 0;
  this.rank = 1;
  this.photoes = '';
  this.createdts = 0;
  this.updatedts = 0;
  this.likes = [];
};

BarDTO.prototype = {
  toJSON: function() {
    return {
      bid: this.bid,
      bname: this.bname,
      tel: this.tel,
      address: this.address,
      descr: this.descr,
      latitude: this.latitude,
      longitude: this.longitude,
      district: this.district,
      rank: this.rank,
      photoes: this.photoes,
      likes: this.likes
    };
  },
  
  fromJSON: function(obj) {
    this.bid = obj.bid || 0;
    this.bname = obj.bname || '';
    this.tel = obj.tel || '';
    this.address = obj.address || '';
    this.descr = obj.descr || '';
    this.latitude = obj.latitude || 0;
    this.longitude = obj.longitude || 0;
    this.district = obj.district || 0;
    this.rank = obj.rank || 1;
    this.photoes = obj.photoes || '';
    this.createdts = obj.createdts || 0;
    this.updatedts = obj.updatedts || 0;
    this.likes = [];
  }
};

var getAllBars = function(cb) {
  var sql = 'select * from bar';
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractBarDTOFromDB(data);
      if (dto.length === 0) {
        //ret = {err: errCode.DBBARNOTEXIST, msg: 'bar not exists!'};
        ret.bars = [];
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.bars = dto;
      }
      cb(ret.err, ret);
    }
  });
};

var getAllBarIds = function(cb) {
  var sql = 'select bid from bar';
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  var ids = [];
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      var rows = data;
      for (var i = 0, len = rows.length; i < len; i++) {
        ids.push(rows[i].bid);
      }
      ret.bids = ids;
      cb(ret.err, ret);
    }
  });
};

var getBarById = function(bid, cb) {
  if (bid === null || bid === undefined) {
    return getAllBars(cb);
  }
  var sql = 'select * from bar where bid='+bid+' limit 1';  
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractBarDTOFromDB(data);
      if (dto.length === 0) {
        ret = {err: errCode.DBBARNOTEXIST, msg: 'bar not exists!'};
      } else if (dto.length > 1) {
        ret = {err: errCode.DBBARDUP, msg: 'duplicated bars!'};
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.bar = dto[0];
      }
      cb(ret.err, ret);
    }
  });
};

var getBarByDistrictId = function(districtId, cb) {
  if (!districtId || districtId === 0) {
    return getAllBars(cb);
  }
  var sql = 'select * from bar where district='+districtId;
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractBarDTOFromDB(data);
      if (dto.length === 0) {
        //ret = {err: errCode.DBBARNOTEXIST, msg: 'bar not exists!'};
        ret.bars = [];
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.bars = dto;
      }
      cb(ret.err, ret);
    }
  });
};

var extractBarDTOFromDB = function(rows) {
  var dto = [], row;
  for (var i = 0, len = rows.length; i < len; i++) {
    row = rows[i];
    row.latitude /= 1000000;
    row.longitude /= 1000000;
    var bar = new BarDTO();
    bar.fromJSON(row);
    dto.push(bar);
  }
  return dto;
}

var saveToDB = function(dto, cb) {
  var ts = util.now();
  var ret = {};
  if (dto.latitude !== undefined && dto.latitude !== null) dto.latitude *= 1000000;
  if (dto.longitude !== undefined && dto.longitude !== null) dto.longitude *= 1000000;
  var sql = 'insert into bar(bname, tel, address, descr, latitude, longitude, district, rank, photoes, createdts, updatedts) values("'+
  dto.bname+'","'+dto.tel+'","'+dto.address+'","'+dto.descr+'","'+dto.latitude+'","'+dto.longitude+'","'+dto.district+'","'+dto.rank+'","'+dto.photoes+'","'+ts+'","'+ts+'")';
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBFAILEDADDBAR;
      ret.msg = 'Failed to add bar: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      ret.msg = 'Success';
      cb(ret.err, ret);
    }
  });
};

var addBar = function(obj, cb) {
  var dto = new BarDTO();
  dto.fromJSON(obj);
  saveToDB(dto, cb);
};

var likeBar = function(barId, userId, cb) {
  var sql = 'insert into user_like_bar(uid, bid, createdts) values("'+
    userId+'", "'+barId+'", "'+util.now()+'")';
  var ret = {};
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBBARLIKE;
      ret.msg = 'Failed to add record into DB: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      ret.msg = 'Success: ' + userId + ' like ' + barId;
      cb(ret.err, ret);
    }
  });
};

var dislikeBar = function(barId, userId, cb) {
  var sql = 'delete from user_like_bar where uid="'+userId+'" and bid="'+barId+'"';
  var ret = {};
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBBARLIKE;
      ret.msg = 'Failed to delete record from DB: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      ret.msg = 'Success: ' + userId + ' dislike ' + barId;
      cb(ret.err, ret);
    }
  });
};

var getLikeList = function(barId, cb) {
  var sql = 'select uid from user_like_bar where bid="'+barId+'" order by createdts limit 10000';
  var ret = {};
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBBARGETLIKES;
      ret.msg = 'Failed to get bar likes from DB: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      var rows = data;
      var ids = [];
      for (var i = 0, len = rows.length; i < len; i++) {
        ids.push(rows[i].uid);
      }
      ret.uids = ids;
      cb(ret.err, ret);
    }
  });
};

var enterBar = function(barId, userId, cb) {
  var ts = util.now();
  var sql = 'insert into user_enter_bar(uid, bid, createdts) values("'+
    userId+'", "'+barId+'", "'+ts+'")';
  var ret = {};
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBBARENTER;
      ret.msg = 'Failed to add record into DB: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      ret.msg = 'Success: ' + userId + ' comes into ' + barId + ' at ' + ts;
      cb(ret.err, ret);
    }
  });
};

var getCustomerList = function(barId, keepDup, cb) {
  var sql = 'select uid, createdts from user_enter_bar where bid="'+barId+'" order by createdts desc limit 500';
  var ret = {};
  var idmap = {};
  var key, i, len;
  var rows, row;
  var ids = [];
  var count = 0;
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBBARGETCUSTOMERS;
      ret.msg = 'Failed to get bar recent customers from DB: ' + data.msg;
      cb(ret.err, ret);
    } else {
      ret.err = 0;
      rows = data;
      for (i = 0, len = rows.length; i < len; i++) {
        row = rows[i];
        if (!keepDup) {
          if (idmap[row.uid] === undefined) {
            idmap[row.uid] = row.createdts;
            ids.push(row.uid, row.createdts);
          }
        } else {
          ids.push(row.uid, row.createdts);
        }
      }
      if (keepDup) {
        ret.uids = ids;
        cb(ret.err, ret);
      } else {
        // ids would be include user basic info, like blow:
        //[['id1', 'phone', 'status', 'nickname', 'gender', 'avatar', 'createdts'], [...]]
        ids = Object.keys(idmap);
        len = ids.length;
        ret.uids = [];
        count = 0;
        for (i = 0; i < len; i++) {
          (function(idx) {
            um.getUserBasicInfoByUID(ids[idx], function(err2, data2) {
              count++;
              if (!err2) {
                ret.uids.push([data2.uid, data2.phone, data2.status, data2.nickname, data2.gender, data2.avatar, idmap[ids[idx]]]);
              }
              if (count === len) {
                cb(0, ret);
              }
            });
          })(i);
        }
      }
    }
  });
};

exports.addBar = addBar;
exports.getAllBars = getAllBars;
exports.getAllBarIds = getAllBarIds;
exports.getBarById = getBarById;
exports.getBarByDistrictId = getBarByDistrictId;
exports.likeBar = likeBar;
exports.dislikeBar = dislikeBar;
exports.getLikeList = getLikeList;
exports.enterBar = enterBar;
exports.getCustomerList = getCustomerList;
