var fs = require('fs-extra');
var path = require('path');
//var util = require('util');

var servDir = '/opt/booker/repo/booker/deploy/middleware/middleware-0.1.0';

exports.readlog = function(req, res, next) {
  var service = req.params.service;
  if (!service) return res.end('no service specified!');
  var servicePath = path.join(servDir, service);
  fs.stat(servicePath, function(err, st) {
    if (err || !st.isDirectory()) return res.end('The service does not existing');
    
    fs.readdir(servicePath, function(err2, files) {
      if (err2) return res.end('Failed to traverse the server folder!');
      var latestLog;
      var mtime = 0;
      var fileSt;
      //var attr;
      var tmpPath;
      for (var i = 0, len = files.length; i < len; i++) {
        if (files[i].indexOf('log_') === 0) {
          tmpPath = path.join(servicePath, files[i]);
          fileSt = fs.statSync(tmpPath);
          //attr = util.inspect(fileSt);
          if (mtime === 0) {
            mtime = fileSt.mtime.getTime();
            latestLog = tmpPath;
          } else if (mtime < fileSt.mtime.getTime()) {
            mtime = fileSt.mtime.getTime();
            latestLog = tmpPath;
          }
        }
      }
      if (latestLog) {
        fs.readFile(latestLog, function(err3, data) {
          if (err3) return res.end('Failed to read log');
          else return res.end(data);
        });
      } else {
        res.end('No log found');
      }
    });
  });
  

};
