var express = require('express');
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
    console.log('bar: ' + fields['barName'] + '--' + fields['barAddress']);
    console.log('latitude:' + fields['barLat'] + ', longitude:' + fields['barLong']);
    var images = files['barPhoto'];
    if (!images || images.length === 0 || images[0].size === 0) {
      res.end('Failed to upload image: no image received');
      return;
    }
    //printObject(img[0]);
    img = images[0];
    var imgName = img.originalFilename;
    var imgPath = img.path;
    var imgNewName = path.basename(imgPath);
    var imgNewPath = path.join(app.get('imagepath'), imgNewName);
    console.log('moving image from: ' + imgPath + ' ===> to: ' + imgNewPath);
    fs.move(imgPath, imgNewPath, function(err) {
      if (err) {
        res.end('Failed to upload image: ' + err);
      } else {
        //res.end('upload done');
        res.redirect('/bar');
      }
    });

  });
});

module.exports = router;
