var http = require('http');
var util = require('./util');
var bookmodel = require('./bookmodel');
var errCode = require('./error').errCode;

var pool = util.dbPool;

/**
* Download book info from Douban and then save into local DB.
*/
var downloadBookFromDouban = function(isbn, bcat, cb) {
    var ret = {};
    var client = http.get('http://api.douban.com/v2/book/isbn/' + isbn, function(res){
      console.log('Received from douban: ' + res.statusCode);
      if (res.statusCode !== 200) {
        ret.err = errCode.APIDOUBANGETBOOKFAILED
        ret.msg = 'Failed to get book from douban';
        cb(ret.err, ret);
        return;
      }
      var bookdata = '', bookdataObj = null;
      res.on('data', function(chunk) {
        bookdata += chunk;
      });
      res.on('end', function() {      
        var save = function() {
          bookmodel.addBookFromDouban(bookdataObj, function(err, data){
            cb(err, data);
          });
        };
      
        bookdataObj = JSON.parse(bookdata);
        bookdataObj.internalcat = bcat || 9;
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
      res.on('error', function() {
        ret.err = errCode.APIBOOKFAILED;
        ret.msg = 'Failed to parse book from douban';
        cb(ret.err, ret);
      });
      res.read();
    });
    
    client.on('error', function(e) {
      console.log('get error from douban: ' + e.message);
      ret.err = errCode.APIDOUBANGETBOOKFAILED;
      ret.msg = e.message;
      cb(ret.err, ret);
    });

};

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

exports.getBookCat = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var ret = {err: 0};
  var sql = 'select * from bookcat';
  var cats = [];
  util.exeDBQuery(pool, sql, function(err, rows) {
    if (err) {
      ret.err = err;
      ret.msg = 'Failed to get book catogory';
      return res.end(JSON.stringify(ret));
    } else {
      for (var i = 0, len = rows.length; i < len; i++) {
        cats.push(rows[i]);
      }
      ret.cats = cats;
      return res.end(JSON.stringify(ret));
    }
  });
}

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
        bookdataObj.internalcat = 9;
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

exports.addBook = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var ret = {err: 0};
  var isbn = req.body.isbn;
  var barid = req.body.barid;
  //var uid = req.body.uid;
  var bcat = req.body.bcat || 9;
  var sql;
  if (!barid || !isbn) {
    ret.err = errCode.APIPARAMSMISSING;
    ret.msg = 'Some request params are missing';
    return res.end(JSON.stringify(ret));
  }
  var afterBookAdded = function(bookDto) {
    // add into DB `bar_shelf`
    bookmodel.addBookToBarShelf(bookDto.bkid, barid, function(err, data) {
      return res.end(JSON.stringify(data));
    });
  };
  
  bookmodel.getBookByIsbn(isbn, function(err, data) {
    if (err && err !== errCode.DBBOOKNOTEXIST) return res.end(JSON.stringify(data));
    
    var bookDto = data.book;
    if (bookDto) {
      console.log('a book is found from DB');
      afterBookAdded(bookDto);
    } else {
      downloadBookFromDouban(isbn, bcat, function(err, data2) {
        if (err) return res.end(JSON.stringify(data2));
        bookDto = data2.book;
        afterBookAdded(bookDto);
      });
    }
  });
  
};

exports.exchangeBook = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var ret = {err: 0};
  var barid = req.body.barid;
  var bisbn = req.body.bisbn;
  var uid = req.body.uid;
  var uisbn = req.body.uisbn;
  var ubookcat = req.body.ubookcat || 9;
  var sql;
  var ts = util.now();
  
  if (!barid || !bisbn || !uid || !uisbn) {
    ret.err = errCode.APIPARAMSMISSING;
    ret.msg = 'Some request params are missing';
    return res.end(JSON.stringify(ret));
  }
  
  var doExchange = function(bookid1, bookid2) {
    bookmodel.removeBookFromBarShelf(bookid1, barid, function(err, data) {
      if (err) return res.end(JSON.stringify(data));
      bookmodel.addBookToBarShelf(bookid2, barid, function(err2, data2) {
        if (err) return res.end(JSON.stringify(data2));
        ret.err = 0;
        ret.msg = 'Succeed to exchange book';
        return res.end(JSON.stringify(ret));
      });
    });
  
  };

  bookmodel.getBookByIsbn(bisbn, function(err, data) {
    if (err) return res.end(JSON.stringify(data));
    var bookDto = data.book;
    if (!bookDto) {
      console.log('a book is found from DB');
      ret.err = errCode.APIBOOKNOTFOUND;
      ret.msg = 'The book is not found in the bar';
      return res.end(JSON.stringify(ret));
    }
    // get user's book.
    bookmodel.getBookByIsbn(uisbn, function(err2, data2) {
      if (err2 && err2 !== errCode.DBBOOKNOTEXIST) return res.end(JSON.stringify(data2));    
      var bookDtoByUser = data2.book;
      if (!bookDtoByUser) {
        downloadBookFromDouban(uisbn, ubookcat, function(err3, data3) {
          if (err3) return res.end(JSON.stringify(data3));
          bookDtoByUser = data3.book;
          if (!bookDtoByUser) {
            ret.err = errCode.APIBOOKNOTFOUND;
            ret.msg = 'The user book cannot be added to shelf';
            return res.end(JSON.stringify(ret));
          }
          doExchange(bookDto.bkid, bookDtoByUser.bkid);
        });
      } else {
        doExchange(bookDto.bkid, bookDtoByUser.bkid);
      }
    });
  });
  
};

exports.getBookByCategory = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var ret = {err: 0};
  var books = [];
  var cat = req.params.cat || -1;
  var sql = 'select bkid, title, internalcat from book';
  if (cat > 0) {
    sql += ' where internalcat="'+cat+'"';
  } else {
    sql += ' where internalcat in(0, 9)';
  }
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      res.end(JSON.stringify(data));
    } else {
      for (var i = 0, len = data.length; i < len; i++) {
        books.push({bkid: data[i].bkid, title: data[i].title, cat: data[i].internalcat});
      }
      ret.books = books;
      return res.end(JSON.stringify(ret));
    }
  });
};

exports.updateCategory = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var ret = {err: 0};
  var bkid = req.body.bookid;
  var cat = req.body.category;
  if (!bkid || !cat) {
    ret.err = APIPARAMSMISSING;
    ret.msg = 'must input bookid and category';
    return res.end(JSON.stringify(ret));
  }
  var sql = 'update book set internalcat="'+cat+'" where bkid="'+bkid+'"';
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      res.end(JSON.stringify(data));
    } else {
      ret.msg = 'Succeed';
      return res.end(JSON.stringify(ret));
    }
  });
};

exports.updateCategory2 = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var data = '', ret = {}, obj;
  
  var updateBookCat = function(bkid, cat) {
    if (!bkid || !cat) {
      ret.err = APIPARAMSMISSING;
      ret.msg = 'must input bookid and category';
      return res.end(JSON.stringify(ret));
    }
    var sql = 'update book set internalcat="'+cat+'" where bkid="'+bkid+'"';
    util.exeDBQuery(pool, sql, function(err, data) {
      if (err) {
        res.end(JSON.stringify(data));
      } else {
        ret.msg = 'Succeed';
        return res.end(JSON.stringify(ret));
      }
    });
  };  

  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    obj = JSON.parse(data);
    updateBookCat(obj.bookid, obj.category);
  });
  req.on('error', function(e) {
    ret.err = errCode.APIBOOKFAILED;
    ret.msg = 'Failed to read request from client';
    res.end(JSON.stringify(ret));
  });
  req.read();
};
