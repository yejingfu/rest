var fs = require('fs');
var exec = require('child_process').exec;

var processName = 'msg_server';

var getProcessId = function(processName, cb) {
  var cmd = 'ps ax | grep -v grep | grep '+processName+' | awk \'{print $1}\'';
  exec(cmd, function(err, stdout, stderr) {
    if (err) return cb(err, '-1');
    var lastch = stdout[stdout.length - 1];
    if (lastch == '\n') {
      stdout = stdout.substring(0, stdout.length - 1);
      cb(0, stdout);
    }
    else {
      cb(0, stdout);
    }
  });
};

var restartProcess = function(cb) {
  console.log('restart server...');
  var cmd = '/opt/booker/repo/booker/deploy/restart_middleware.sh';
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      console.log('Failed to call restart_middleware.sh, will try again');
      setTimeout(function(){
        restartProcess(cb);
      }, 1000);
    } else {
      setTimeout(function() {
        cb(0);
      }, 1000);
    }
  });
};

var watchFile = function(filename) {
  fs.watchFile(filename, function(curr, prev) {
    fs.exists(filename, function(exists){
      if (!exists) {
        fs.unwatchFile(filename);
        restartProcess(function(err) {
          if (err) console.log('Failed to restart process...');
          else {
            setTimeout(function() {
              launch();
            }, 1000);
          }
        });
      }
    });
  });
};

var launch = function() {
  getProcessId(processName, function(err, processId) {
    var fileName = '/proc/'+processId+'/status';
    fs.exists(fileName, function(exists) {
      if (!exists) {
        setTimeout(function() {
          launch();
        }, 5000);
      } else {
        watchFile(fileName);
      }
    });
  });
};

launch();
