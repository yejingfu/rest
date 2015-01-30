// bar model
var util = require('./util');
var error = require('./error');
var errCode = error.errCode;

var pool = util.dbPool;

var BarDTO = function() {
  this.bid = 0;
  this.bname = '';
  this.tel = '';
  this.address = '';
  this.latitude = '';
  this.longitude = '';
  this.district = 0;
  this.rank = 1;
  this.photoes = '';
  this.createdts = 0;
  this.updatedts = 0;
};

BarDTO.prototype = {
  toJSON: function() {
    return {
      bid: this.bid,
      bname: this.bname,
      tel: this.tel,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      district: this.district,
      rank: this.rank,
      photoes: this.photoes
    };
  },
  
  fromJSON: function(obj) {
    this.bid = obj.bid || 0;
    this.bname = obj.bname || '';
    this.tel = obj.tel || '';
    this.address = obj.address || '';
    this.latitude = obj.latitude || '';
    this.longitude = obj.longitude || '';
    this.district = obj.district || 0;
    this.rank = obj.rank || 1;
    this.photoes = obj.photoes || '';
    this.createdts = obj.createdts || 0;
    this.updatedts = obj.updatedts || 0;
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
        ret = {err: errCode.DBBARNOTEXIST, msg: 'bar not exists!'};
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
  var sql = 'select * from bar where district='+districtId+' limit 1';
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

var extractBarDTOFromDB = function(rows) {
  var dto = [];
  for (var i = 0, len = rows.length; i < len; i++) {
    var bar = new BarDTO();
    bar.fromJSON(rows[i]);
    dto.push(bar);
  }
  return dto;
}

var saveToDB = function(dto, cb) {
  var ts = util.now();
  var ret = {};
  var sql = 'insert into bar(bname, tel, address, latitude, longitude, district, rank, photoes, createdts, updatedts) values("'+
  dto.bname+'","'+dto.tel+'","'+dto.address+'","'+dto.latitude+'","'+dto.longitude+'","'+dto.district+'","'+dto.rank+'","'+dto.photoes+'","'ts+'","'+ts+'")';
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

exports.addBar = addBar;
exports.getAllBars = getAllBars;
exports.getAllBarIds = getAllBarIds;
exports.getBarById = getBarById;
exports.getBarByDistrictId = getBarByDistrictId;
