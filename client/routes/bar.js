var express = require('express');
var http = require('http');
var router = express.Router();
var multiparty = require('multiparty');
var path = require('path');
var fs = require('fs-extra');

var app = undefined;

var DBServerIP = '121.199.58.239';  // 'localhost';

router.setApp = function(app_) { app = app_; }

var printBody = function(req) {
  printObject(req.body);
};

var printObject = function(obj) {
  for (var k in obj) {
    console.log('obj['+k+']: ' + obj[k]);
  }
};

var getAllBars = function(cb) {
  var client = http.get('http://'+DBServerIP+':3011/bar/all', function(res) {
    console.log('received from server:'+ res.statusCode);
    if (res.statusCode !== 200) {
      return cb(1, 'statusCode: ' + res.statusCode);
    } 
    var data = '', obj;
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      obj = JSON.parse(data);
      cb(0, obj);
    });
    res.on('error', function(e) {
      return cb(2, 'Failed to get bar info from server: '+ e);
    });
    res.read();
  });
  
  client.on('error', function(e) {
    cb(3, 'Failed to connect to server: ' + e);
  });
};

var getBarById = function(bid, cb) {
  var client = http.get('http://'+DBServerIP+':3011/bar/id/'+bid, function(res) {
    console.log('received from server: ' + res.statusCode);
    if (res.statusCode !== 200) {
      return cb(1, 'statusCode: ' + res.statusCode);
    }
    var data = '', obj;
    res.on('data', function(d) {
      data += d;
    });
    res.on('end', function() {
      obj = JSON.parse(data);
      cb(0, obj);
    });
    res.on('error', function(e) {
      return cb(2, 'Failed to get bar info from server: ' + e);
    });
    res.read();
  });

  client.on('error', function(e) {
    cb(3, 'Failed to connect to server: ' + e);
  });
};

/* GET users listing. */
router.get('/', function(req, res) {
  getAllBars(function(err, obj) {
    var ctx = { title: 'Booker-bar' };
    ctx.bars = [];
    if (err) {
      ctx.err = obj;
    } else {
      ctx.bars = obj.bars;
    }
    //console.log('ctx:'+JSON.stringify(ctx));
    res.render('bar', ctx);
  });
});

router.get('/add', function(req, res) {
  res.render('addbar', {title: 'add bar'});
});

router.post('/add', function(req, res) {
  //printBody(req);
  //var name = req.body.bar.name;
  //var address = req.body.bar.address;
  
  // upload image
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    /* inspect...
    Object.keys(fields).forEach(function(n) {
      console.log('get field name: ' + n);
    });
    Object.keys(files).forEach(function(n) {
      console.log('get file name: ' + n);
    });
    */
    //console.log('bar: ' + fields['barName']+'--'+fields['barTel'] + '--' + fields['barAddress']+ '--' + fields['barDistrict']);
    //console.log('latitude:' + fields['barLat'] + ', longitude:' + fields['barLong']);
    //console.log('bar description:'+fields['barDesc']);

    if (fields['barCHK'] != '654321') {
      return res.end('The code code is not correct!!!');
    }

    var images = files['barPhoto'];
    if (!images || images.length === 0) {
      res.end('Failed to upload image: no image received');
      return;
    }

    var i, len, count, validImages = [], validImageNames = [];
    for (i = 0, len = images.length; i < len; i++) {
      if (images[i] && images[i].size !== 0) {
        validImages.push(images[i]);
      }
    }
    //console.log('bar photo len:'+ validImages.length);
    
    var saveToDB = function() {
      var barObj = {};
      barObj.bname = fields['barName'][0];
      barObj.tel = fields['barTel'][0];
      barObj.address = fields['barAddress'][0];
      barObj.descr = fields['barDesc'][0];
      barObj.latitude = fields['barLat'][0];
      barObj.longitude = fields['barLong'][0];
      barObj.district = fields['barDistrict'][0];
      barObj.rank = 1;
      barObj.photoes = validImageNames.join(';');
      addBarToServer(false, barObj, function(err) {
        if (!err)
          console.log('succeed to addBarToServer');
        else
          console.log('failed to addBarToServer: ' + err);
      });
    };

    var img, imgName, imgPath, imgNewName, imgNewPath;
    for (i = 0, count = 0, len = validImages.length; i < len; i++) {
      img = validImages[i];
      imgName = img.originalFilename;
      imgPath = img.path;
      imgNewName = path.basename(imgPath);
      imgNewPath = path.join(app.get('imagepath'), imgNewName);
      //console.log('==> image: ' + imgNewPath);
      (function(from, to, newName){
      fs.move(from, to, function(err) {
        count += 1;
        if (!err) {
          validImageNames.push(newName);
        } else {
          console.log('Failed to upload image: form:'+from+'--to: ' + to);
        }
        if (count === len) {
          if (validImageNames.length === 0) {
            res.end('Failed to upload image');
          } else {
            saveToDB();
            res.redirect('/bar');
          }
        }
      });
      })(imgPath, imgNewPath, imgNewName);
    }

  });
});

router.get('/edit/:barid', function(req, res) {
  var bid = req.params.barid;
  if (!bid) return res.end('Invalid bar id');
  getBarById(bid, function(err, data) {
    //console.log('ctx:'+JSON.stringify(data));
    var ctx = {err: err, title: 'Booker-bar', bar: {} };
    if (err) {
      return res.end('Failed to get bar info: ' + bid);
    } else {
      ctx.bar = data.bar;
      ctx.bar.bid = bid;
      res.render('editbar', ctx);
    }
  });
});

router.post('/edit/:barid', function(req, res) {
  var bid = req.params.barid;
  //console.log('Jeff: post edit: ' + bid);
  if (!bid) return res.end('Invalid bar id');
  // upload image
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    var images = files['barPhoto'];
    if (!images || images.length === 0) {
      res.end('Failed to upload image: no image received');
      return;
    }

    if (fields['barCHK'] != '654321') {
      return res.end('The code code is not correct!!!');
    }

    var i, len, count, validImages = [], validImageNames = [];
    for (i = 0, len = images.length; i < len; i++) {
      if (images[i] && images[i].size !== 0) {
        validImages.push(images[i]);
      }
    }
    var saveToDB = function() {
      var barObj = {};
      barObj.bid = bid;
      barObj.bname = fields['barName'][0];
      barObj.tel = fields['barTel'][0];
      barObj.address = fields['barAddress'][0];
      barObj.descr = fields['barDesc'][0];
      barObj.latitude = fields['barLat'][0];
      barObj.longitude = fields['barLong'][0];
      barObj.district = fields['barDistrict'][0];
      barObj.rank = 1;
      barObj.photoes = validImageNames.join(';');
      addBarToServer(true, barObj, function(err) {
        if (!err)
          console.log('succeed to addBarToServer');
        else
          console.log('failed to addBarToServer: ' + err);
      });
    };

    var img, imgName, imgPath, imgNewName, imgNewPath;
    for (i = 0, count = 0, len = validImages.length; i < len; i++) {
      img = validImages[i];
      imgName = img.originalFilename;
      imgPath = img.path;
      imgNewName = path.basename(imgPath);
      imgNewPath = path.join(app.get('imagepath'), imgNewName);
      //console.log('==> image: ' + imgNewPath);
      (function(from, to, newName){
      fs.move(from, to, function(err) {
        count += 1;
        if (!err) {
          validImageNames.push(newName);
        } else {
          console.log('Failed to upload image: form:'+from+'--to: ' + to);
        }
        if (count === len) {
          if (validImageNames.length === 0) {
            res.end('Failed to upload image');
          } else {
            saveToDB();
            res.redirect('/bar');
          }
        }
      });
      })(imgPath, imgNewPath, imgNewName);
    }

  });


});

var addBarToServer = function(edit, barObj, cb) {
  var options = {
    hostname: DBServerIP, //'121.199.58.239',
    port: 3011,
    path: '/bar2',
    method: 'POST'
  };
  if (edit) options.path = '/updatebar2'
  var req = http.request(options, function(res) {
    //console.log('res status: ' + res.statusCode);
    if (res.statusCode !== 200) {
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      cb(1);
    } else {
      cb(0);
    }
  });
  req.on('error', function(e) {
    cb(e);
  });
  
  //console.log('bar:'+JSON.stringify(barObj));
  
  req.write(JSON.stringify(barObj));
  req.end();
}; 

module.exports = router;
