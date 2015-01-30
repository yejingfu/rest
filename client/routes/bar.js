var express = require('express');
var http = require('http');
var router = express.Router();
var multiparty = require('multiparty');
var path = require('path');
var fs = require('fs-extra');

var app = undefined;

router.setApp = function(app_) { app = app_; }

var printBody = function(req) {
  printObject(req.body);
};

var printObject = function(obj) {
  for (var k in obj) {
    console.log('obj['+k+']: ' + obj[k]);
  }
};


/* GET users listing. */
router.get('/', function(req, res) {
  res.render('bar', { title: 'Booker-bar' });
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
    console.log('bar: ' + fields['barName']+'--'+fields['barTel'] + '--' + fields['barAddress']+ '--' + fields['barDistrict']);
    console.log('latitude:' + fields['barLat'] + ', longitude:' + fields['barLong']);
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
    console.log('bar photo len:'+ validImages.length);
    
    var saveToDB = function() {
      var barObj = {};
      barObj.bname = fields['barName'];
      barObj.tel = fields['barTel'];
      barObj.address = fields['barAddress'];
      barObj.latitude = fields['barLat'];
      barObj.longitude = fields['barLong'];
      barObj.district = fields['barDistrict'];
      barObj.rank = 1;
      barObj.photoes = validImageNames.join(';');
      addBarToServer(barObj, function(err) {
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
      console.log('==> image: ' + imgNewPath);
      (function(from, to, newName){
      fs.move(from, to, function(err) {
        count += 1;
        if (!err) {
          validImageNames.push(newName);
        }
        if (count === len - 1) {
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

var addBarToServer = function(barObj, cb) {
  var options = {
    hostname: '121.199.58.239',
    port: 3011,
    path: '/bar',
    method: 'POST'
  };
  http.request(options, function(res) {
    console.log('res status: ' + res.statusCode);
    cb(0);
  });
  req.on('error', function(e) {
    cb(e);
  });
  
  req.write(JSON.stringify(barObj));
  req.end();
}; 

module.exports = router;
