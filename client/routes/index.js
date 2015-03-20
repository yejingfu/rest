var path = require('path');
var http = require('http');
var fs = require('fs-extra');
var uuid = require('node-uuid');
var multiparty = require('multiparty');

var express = require('express');
var router = express.Router();

var imgStoragePath = path.join(__dirname, '..', 'public', 'images');

var app = undefined;
router.setApp = function(app_) { app = app_; }

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

router.getFeedbacks = function(req, res) {
  var uid = req.params.uid || 0;
  var feedbacks, i, len, content, ctx;
  var doRender = function(obj) {
    feedbacks = obj.feedbacks || [];
    for (i = 0, len = feedbacks.length; i < len; i++) {
      content = feedbacks[i][2];
      feedbacks[i][2] = new Buffer(content, 'base64').toString('utf8');
      //console.log('feedback['+i+']:' + feedbacks[i][2]);
    }
    ctx = {title: 'feedback', feedbacks: feedbacks};
    res.render('feedback', ctx);
  };

  var client = http.get('http://121.199.58.239:3011/user/feedbacks/'+uid, function(res2) {
    console.log('getFeedbacks received from server: ' + res2.statusCode);
    if (res2.statusCode !== 200) {
      return res.end('Failed to get feedback from DB, statusCode: ' + res2.statusCode);
    }
    var data = '';
    res2.on('data', function(d) {
      data += d;
    });
    res2.on('end', function() {
      doRender(JSON.parse(data));
    });
    res2.on('error', function(e) {
      return res.end('Failed to get feedback from DB: ' + e);
    });
    res2.read();
  });

  client.on('error', function(e) {
    return res.end('Failed to connect to server: ' + e);
  });
};

router.showRecommendation = function(req, res) {
  var ctx = {title: 'Booker'};
  res.render('recommendation', ctx);
};

var base64Encode = function(str) {
  return new Buffer(str).toString('base64');
};

router.postRecommendation = function(req, res) {

  var addToDBServer = function(title, summary, thumbnail, cb) {
    console.log('addToDBServer: ' + title + '--' + summary+'--'+thumbnail);
    var options = {
      hostname: app.get('DBServerIP'),  //'localhost'
      port: 3011,
      path: '/recommendation',
      method: 'POST'
    };

    var client = http.request(options, function(res2) {
      if (res2.statusCode !== 200) {
        console.log('Faied to call DB server: ' + res2.statusCode);
        cb(1 + ':'+res2.statusCode);
      } else {
        cb(0);
      }
    });

    client.on('error', function() {
      cb(2);
    });
    var reqObj = {
      title: title,
      summary: summary,
      thumbnail: thumbnail
    };
    client.write(JSON.stringify(reqObj));
    client.end();
  };

  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    if (err) return res.end("Failed to parse multiparty form");
    var title = base64Encode(fields['recTitle'][0]);
    var summary = base64Encode(fields['recSummary'][0]);
    var thumbnail = files['recThumbnail'][0];
    if (!title || !summary || !thumbnail || thumbnail.size == 0) return res.end("Invalid title, summary or thumbnail");
    var imgPath = thumbnail.path;
    var imgName = path.basename(imgPath);
    var imgNewPath = path.join(app.get('imagepath'), imgName);
    fs.move(imgPath, imgNewPath, function(err2) {
      if (err2) return res.end('Failed to store image into: ' + imgNewPath);
      addToDBServer(title, summary, imgName, function(err3) {
        if (err3) {
          return res.end('Failed to upload to server: ' + err3);
        } else {
          res.setHeader('Content-Type', 'text/html');
          return res.end('<html><body>Succeed to post book recommandation!<br><a href="/recommend">add more</a></body></html>');
        }
      });
    });
  });
};

module.exports = router;
