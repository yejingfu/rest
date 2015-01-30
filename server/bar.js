// bar

var http = require('http');
var util = require('./util');
var barmodel = require('./barmodel');
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

exports.getBarByDistrictId = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var districtId = req.params.districtid;
  barmodel.getBarByDistrictId(districtId, function(err, data) {
    if (err) console.log('Failed to get bar by district id');
    if (data && data.bar) {
      res.end(JSON.stringify(data));
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
    res.end(stringify(data));
  });
};


exports.getAllBarIds = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  barmodel.getAllBarIds(function(err, data){
    if (err) console.log('Failed to get all bar ids');
    res.end(stringify(data));
  });
};

exports.addBar = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var obj = {};
  obj.bname = req.body.bname;
  obj.tel = req.body.tel;
  obj.address = req.body.address;
  obj.latitude = req.body.latitude;
  obj.longitude = req.body.longitude;
  obj.district = req.body.district;
  obj.rank = req.body.rank;
  obj.photoes = req.body.photoes;
  
  barmodel.addBar(obj, function(err, data) {
    if (err) console.log('Failed to add bar into DB');
    res.end(JSON.stringify(data));
  });
};

