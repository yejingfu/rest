var path = require('path');
var fs = require('fs-extra');
var uuid = require('node-uuid');

var express = require('express');
var router = express.Router();

var imgStoragePath = path.join(__dirname, '..', 'public', 'images');

var saveBase64Image = function(body, cb) {
  var ret = {err: 0};
  var data = body.data;
  var ext = body.ext;
  var encode = body.encode;
  //console.log('saveBase64Image:' + ext + '--'+encode + data);
  if (encode !== 'base64') {
    return cb({err: 1, msg: 'The data should be base64 encoded'});
  }
/*
  var matches = data.match(/^data:[A-Za-z-+\/];base64,(.+)$/);
  if (matches.length != 3) {
    return cb({err: 2, msg: 'Invalid image data'});
  }
  data = matches[2];
*/
  var header = data.substring(0, 25);
  var idx  = header.indexOf('base64,');
  if (idx >= 0) {
    data = data.substring(idx + 7);
  }
  var imageName = uuid.v4() + '.' + ext || 'png';
  var imagePath = path.join(imgStoragePath, imageName);
  fs.writeFile(imagePath, data, 'base64', function(err) {
    if (err) {
      cb({err: 3, msg: 'Failed to save image to disk'});
    } else {
      ret.name = imageName;
      return cb(ret);
    }
  });
};

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.uploadimage = function(req, res) {
  if (req.method === 'GET') {
    res.render('uploadimage', { title: 'Booker' });
  } else if (req.method === 'POST') {
    saveBase64Image(req.body, function(ret) {
      res.end(JSON.stringify(ret));
    });
  }
};

module.exports = router;
