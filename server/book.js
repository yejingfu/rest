var http = require('http');
var util = require('./util');
var bookmodel = require('./bookmodel');
var errCode = require('./error').errCode;

exports.test = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  util.downloadImage('http://img3.douban.com/spic/s27963383.jpg', function(err, ret) {
    if (err) {
      res.end(JSON.stringify(ret));
    } else {
      //res.setHeader('Content-Type', 'image/jpeg');
      //res.end(ret);
      res.end(JSON.stringify(ret));
    }
  });
};

exports.getBookByISBN = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  console.log('isbn:'+req.params.isbn);
  //return res.end('ok');
  
  var isbn = req.params.isbn || '9787550235496';
  var doubanHost = 'https://api.douban.com';
  var url = '/v2/book/isbn/' + isbn;
  var ret = {err: 1, msg: 'The isbn is not set!'};
  if (!isbn) {
    return res.end(JSON.stringify(ret));
  }
  
  bookmodel.getBookByIsbn(isbn, function(err, data) {
    if (err && err !== errCode.DBBOOKNOTEXIST) return res.end(JSON.stringify(data));
    
    var dto = data.book;
    if (dto) {
      console.log('a book is found from DB');
      return res.end(JSON.stringify(dto.toJSON()));
    }
    var client = http.get('http://api.douban.com/v2/book/isbn/' + isbn, function(res2){
      console.log('Received from douban...');
      console.log('Status: ' + res2.statusCode);
      if (res2.statusCode !== 200) {
        ret.err = errCode.APIBOOKNOTFOUND;
        ret.msg = 'Failed to get book from douban';
        res.end(JSON.stringify(ret));
        return;
      }
      var bookdata = '', bookdataObj = null;
      res2.on('data', function(data2) {
        bookdata += data2;
      });
      res2.on('end', function() {
      
        var save = function() {
          bookmodel.addBookFromDouban(bookdataObj, function(err, data3){
            if (err) return res.end(JSON.stringify(data3));
            if (data3.book) {
              res.end(JSON.stringify(data3.book.toJSON()));
              return;
            }
          });
        };
      
        bookdataObj = JSON.parse(bookdata);
        bookdataObj.thumbnail = bookdataObj.images.small || bookdataObj.images.medium || bookdataObj.images.large;
        if (bookdataObj.thumbnail) {
          util.downloadImage(bookdataObj.thumbnail, function(err, ret) {
            if (!err) {
              bookdataObj.thumbnail = ret.image;
            }
            save();
          });
        } else {
          save();
        }
      });
      res2.on('error', function() {
        ret.err = errCode.APIBOOKFAILED;
        ret.msg = 'Failed to parse book from douban';
        return res.end(JSON.stringify(ret));
      });
      res2.read();
      
      //res2.pipe(res);
    });
    client.on('error', function(e) {
      console.log('get error from douban: ' + e.message);
      ret.err = 2;
      ret.msg = e.message;
      res.end(JSON.stringify(ret));
    });
  
  });
  
  
  /** solution 1
  var client = http.request({
    hostname: 'api.douban.com',
    port: 80,
    path: 'v2/book/isbn/9787550235496',
    method: 'GET'
  }, function(data){
    console.log('received data from douban...');
    res.end(data);
  });
  */
  
  /** solution 2

  var client = http.get('http://api.douban.com/v2/book/isbn/' + isbn, function(res2){
    console.log('Received from douban...');
    console.log('Status: ' + res2.statusCode);
    res2.pipe(res);
  });
  client.on('error', function(e) {
    console.log('get error from douban: ' + e.message);
    ret.err = 2;
    ret.msg = e.message;
    res.end(JSON.stringify(ret));
  });
  */
  
};
