// bar

var http = require('http');
var util = require('./util');
var barmodel = require('./barmodel');
var bookmodel = require('./bookmodel');
var errCode = require('./error').errCode;

exports.getBarById = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var id = req.params.id;
  barmodel.getBarById(id, function(err, data) {
    if (err) console.log('Failed to get bar by id');
    if (data && data.bar) {
      res.end(JSON.stringify(data));
    } else {
      var ret = {err: errCode.APIBARFAILED, msg: 'Failed to get bar'};
      res.end(JSON.stringify(ret));
    }
  });
};

var getBarLikes = function(bars, cb) {
  var len = bars.length;
  var i, j = 0;
  if (bars.length === 0) return cb();
  for (i = 0; i < len; i ++) {
    (function(idx){
    barmodel.getLikeList(bars[idx].bid, function(err, data) {
      if (err) {
        bars[idx].likes = [];
      } else {
        bars[idx].likes = data.uids;
      }
      j++;
      if (j === len) {
        cb();
      }
    });
    })(i);
  }
}

exports.getBarByDistrictId = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var districtId = req.params.districtid;
  barmodel.getBarByDistrictId(districtId, function(err, data) {
    if (err) console.log('Failed to get bar by district id');
    if (data && data.bars) {
      getBarLikes(data.bars, function(){
        res.end(JSON.stringify(data));
      });
    } else {
      var ret = {err: errCode.APIBARFAILED, msg: 'Failed to get bar'};
      res.end(JSON.stringify(ret));
    }
  });
};


exports.getAllBars = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  barmodel.getAllBars(function(err, data) {
    if (err) console.log('Failed to get all bar');
    if (data && data.bars) {
      getBarLikes(data.bars, function() {
        res.end(JSON.stringify(data));
      });
    } else {
      res.end(JSON.stringify(data));
    }
  });
};


exports.getAllBarIds = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  barmodel.getAllBarIds(function(err, data){
    if (err) console.log('Failed to get all bar ids');
    res.end(JSON.stringify(data));
  });
};

exports.addBar = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var obj = {};
  obj.bname = req.body.bname || '';
  obj.tel = req.body.tel || '';
  obj.address = req.body.address || '';
  obj.descr = req.body.descr || '';
  obj.latitude = req.body.latitude || 0;
  obj.longitude = req.body.longitude || 0;
  obj.district = req.body.district || '';
  obj.rank = req.body.rank || 0;
  obj.photoes = req.body.photoes || '';
  
  barmodel.addBar(obj, function(err, data) {
    if (err) console.log('Failed to add bar into DB');
    res.end(JSON.stringify(data));
  });
};

exports.addBar2 = function(req, res, next) {
  // get post request from Node.js client 
  res.setHeader('Content-Type', 'text/json');
  
  var data = '', ret = {}, obj;
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    obj = JSON.parse(data);
    barmodel.addBar(obj, function(err, data2) {
      if (err) {
        console.log('Failed to add bar into DB: ' + err.msg);
      } else {
        console.log('Succeed to add bar into DB');
        res.end(JSON.stringify(data2));
      }
    });
  });
  req.on('error', function(e) {
    ret.err = errCode.APIBARFAILED;
    ret.msg = 'Failed to read request from client';
    res.end(JSON.stringify(ret));
  });
  req.read();
};

exports.updateBar2 = function(req, res, next) {
  // get post request from Node.js client 
  res.setHeader('Content-Type', 'text/json');
  
  var data = '', ret = {}, obj;
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    obj = JSON.parse(data);
    barmodel.updateBar(obj, function(err, data2) {
      if (err) {
        console.log('Failed to update bar into DB: ' + err.msg);
      } else {
        console.log('Succeed to update bar into DB');
        res.end(JSON.stringify(data2));
      }
    });
  });
  req.on('error', function(e) {
    ret.err = errCode.APIBARFAILED;
    ret.msg = 'Failed to read request from client';
    res.end(JSON.stringify(ret));
  });
  req.read();
};

exports.getAllBooks = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.barid;
  var bookcat = req.params.bookcat || 0;
  var sql;
  var ret = {err: 0};
  var bkids = {};
  sql = 'select * from bar_shelf where barid="'+barid+'" and copy>0 and status=0';
  util.exeDBQuery(util.dbPool, sql, function(err, data) {
    if (err) return res.end(JSON.stringify(data));
    for (var i = 0, len = data.length; i < len; i++) {
      bkids[data[i].bkid] = data[i].copy;
    }
    ret.books = [];
    bookmodel.getBookByBkIds(Object.keys(bkids), bookcat, function(err2, data2) {
      if (err2 || !data2.books) return res.end(JSON.stringify(data2));
      for (var i = 0, len = data2.books.length; i < len; i++) {
        data2.books[i].copy = bkids[data2.books[i].bkid].copy;
        ret.books.push(data2.books[i]);
      }
      return res.end(JSON.stringify(ret));
    });
  });
};

exports.getAllLikes = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.id;
  barmodel.getLikeList(barid, function(err, data) {
    if (err) console.log('Failed in getAllLikes');
    res.end(JSON.stringify(data));
  });
};

exports.likeBar = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.barid;
  var userid = req.params.userid;
  barmodel.likeBar(barid, userid, function(err, data) {
    if (err) console.log('Failed in likeBar');
    res.end(JSON.stringify(data));
  });
};

exports.dislikeBar = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.barid;
  var userid = req.params.userid;
  barmodel.dislikeBar(barid, userid, function(err, data) {
    if (err) console.log('Failed in dislikeBar');
    res.end(JSON.stringify(data));
  });
};

exports.getAllCustomers = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.id;
  barmodel.getCustomerList(barid, false, function(err, data) {
    if (err) console.log('Failed in getAllCustomers');
    res.end(JSON.stringify(data));
  });
};

exports.enter = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var barid = req.params.barid;
  var userid = req.params.userid;
  barmodel.enterBar(barid, userid, function(err, data) {
    if (err) console.log('Failed in enter');
    res.end(JSON.stringify(data));
  });
};



