var util = require('./util');
var error = require('./error');
var errCode = error.errCode;

var pool = util.dbPool;

// book model interact with DB
var BookDTO = function() {
  this.bkid = 0;
  this.isbn10 = '';
  this.isbn13 = '';
  this.title = '';
  this.subtitle = '';
  this.summary = '';
  this.catalog = '';
  this.internalcat = 0;
  this.author = '';
  this.authorintro = '';
  this.publisher = '';
  this.pubdate = '';
  this.thumbnail = '';
  this.createdts = 0;
};

BookDTO.prototype = {
  toJSON: function() {
    return {
      bkid: this.bkid,
      isbn10: this.isbn10,
      isbn13: this.isbn13,
      title: this.title,
      subtitle: this.subtitle,
      summary: this.summary,
      catalog: this.catalog,
      internalcat: this.internalcat,
      author: this.author,
      authorintro: this.authorintro,
      publisher: this.publisher,
      pubdate: this.pubdate,
      thumbnail: this.thumbnail
    };
  },
  
  fromJSON: function(obj) {
    this.bkid = obj.bkid || 0;
    this.isbn10 = obj.isbn10 || '';
    this.isbn13 = obj.isbn13 || '';
    this.title = obj.title || '';
    this.subtitle = obj.subtitle || '';
    this.summary = obj.summary || '';
    this.catalog = obj.catalog || '';
    this.internalcat = obj.internalcat || 0;
    this.author = obj.author || '';
    this.authorintro = obj.authorintro || '';
    this.publisher = obj.publisher || '';
    this.pubdate = obj.pubdate|| '';
    this.thumbnail = obj.thumbnail || '';
    this.createdts = obj.createdts || 0;
  }
};

var saveToDB = function(dto, cb) {
  var ts = util.now();
  var ret = {};
  var sql = 'insert into book(isbn10, isbn13, title, subtitle, summary, catalog, internalcat, author, authorintro, publisher, pubdate, thumbnail, createdts) values("'+
  dto.isbn10+'","'+dto.isbn13+'","'+dto.title+'","'+dto.subtitle+'","'+dto.summary+'","'+dto.catalog+'","'+dto.internalcat+'","'+dto.author+'","'+dto.authorintro+'","'+dto.publisher+'","'+dto.pubdate+'","'+dto.thumbnail+'","'+ts+'")';
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = errCode.DBFAILEDADDBOOK;
      ret.msg = 'Failed to add book: ' + data.msg;
      cb(ret.err, ret);
    } else {
      // query again
      getBookByIsbn(dto.isbn13||dto.isbn10, function(err, data2){
        if (err) {
          ret.err = errCode.DBFAILEDADDBOOK;
          ret.msg = 'Failed to get after book added: ' + data2.msg;
          cb(ret.err, ret);
        } else {
          cb(0, data2);
        }
      });
    }
  });
};

var getBookByIsbn = function(isbn, cb) {
  var sql = 'select * from book where isbn10='+isbn+' or isbn13='+isbn+' limit 1';
  var dto;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dto = extractBookDTOFromDB(data);
      if (dto.length === 0) {
        ret = {err: errCode.DBBOOKNOTEXIST, msg: 'book not exists!'};
      } else if (dto.length > 1) {
        ret = {err: errCode.DBBOOKDUP, msg: 'duplicated books!'};
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.book = dto[0];
      }
      cb(ret.err, ret);
    }
  });
};

var getBookByBkIds = function(bkids, bkcat, cb) {
  var sql = 'select * from book where bkid in(';
  for (var i = 0, len = bkids.length - 1; i < len; i++) {
    sql += '"'+bkids[i]+'", ';
  }
  sql += '"'+bkids[i]+'")';
  if (bkcat && bkcat !== 0) {
    sql += ' and internalcat="'+bkcat+'"';
  }
  var dtolist;
  var ret = {err: 0};
  if (typeof cb !== 'function') {
    return;
  }
  
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      dtolist = extractBookDTOFromDB(data);
      if (dtolist.length === 0) {
        ret = {err: errCode.DBBOOKNOTEXIST, msg: 'book not exists!'};
      } else {
        //console.log('ddd:'+JSON.stringify(dto[0].toJSON()));
        ret.books = dtolist;
      }
      cb(ret.err, ret);
    }
  });
};

var extractBookDTOFromDB = function(rows) {
  var dto = [];
  for (var i = 0, len = rows.length; i < len; i++) {
    var book = new BookDTO();
    book.fromJSON(rows[i]);
    dto.push(book);
  }
  return dto;
}

var addBookFromDouban = function(douObj, cb) {
  var book = new BookDTO();
  book.bkid = 0;
  book.isbn10 = douObj.isbn10;
  book.isbn13 = douObj.isbn13;
  book.title = douObj.title;
  book.subtitle = douObj.subtitle;
  book.summary = douObj.summary;
  book.catalog = douObj.catalog;
  book.internalcat = 0;
  book.author = douObj.author.join(';');
  book.authorintro = douObj.author_intro;
  book.publisher = douObj.publisher;
  book.pubdate = douObj.pubdate;
  book.thumbnail = douObj.thumbnail || douObj.images.small || douObj.images.medium || douObj.images.large;
  book.createdts = util.now();
  
  // save to db
  saveToDB(book, function(err, data) {
    cb(err, data);
  });
};

var addBookToBarShelf = function(bkid, barid, cb) {
  var ret = {err: 0};
  var sql = 'select * from bar_shelf where bkid="'+bkid+'" and barid="'+barid+'" limit 1';
  var rows;
  var ts = util.now();
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      rows = data;
      if (rows.length === 0) {
        // insert 
        sql = 'insert into bar_shelf(bkid, barid, createdts, updatedts) values("'+bkid+'", "'+barid+'", "'+ts+'", "'+ts+'")';
        util.exeDBQuery(pool, sql, function(err2, data2) {
          if (err2) {
            ret.err = errCode.DBUPDATE;
            ret.msg = 'Failed to insert bar-book into bar_shelf : ' + data2;
          } else {
            ret.err = 0;
          }
          cb(ret.err, ret);
        });
      } else if (rows.length === 1) {
        // update copies
        //var copy = parseInt(rows[0].copy) + 1;
        var copy = rows[0].copy + 1;
        sql = 'update bar_shelf set copy="'+copy+'", status="0", updatedts="'+ts+'" where bsid="'+rows[0].bsid+'"';
        util.exeDBQuery(pool, sql, function(err3, data3) {
          if (err3) {
            ret.err = errCode.DBUPDATE;
            ret.msg = 'Failed to update copies of bar-book in bar_shelf : ' + data3;
          } else {
            ret.err = 0;
          }
          cb(ret.err, ret);
        });
      } else {
        ret.err = errCode.DBQUERY;
        ret.msg = 'duplicated book-bar record in bar_shelf';
        cb(ret.err, ret);
      }
    }
  });
};

var removeBookFromBarShelf = function(bkid, barid, cb) {
  var ret = {err: 0};
  var sql = 'select * from bar_shelf where bkid="'+bkid+'" and barid="'+barid+'" limit 1';
  var rows;
  var ts = util.now();
  util.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      cb(err, data);
    } else {
      rows = data;
      if (rows.length === 0) {
        ret.msg = 'No book '+bkid+' found in the bar '+barid;
        cb(ret.err, ret);
      } else if (rows.length === 1) {
        // update copies
        //var copy = parseInt(rows[0].copy) + 1;
        var copy = rows[0].copy - 1;
        var status = rows[0].status;
        if (copy < 0) copy = 0;
        if (copy === 0) status = 1;
        sql = 'update bar_shelf set copy="'+copy+'", status="'+status+'", updatedts="'+ts+'" where bsid="'+rows[0].bsid'"';
        util.exeDBQuery(pool, sql, function(err3, data3) {
          if (err3) {
            ret.err = errCode.DBUPDATE;
            ret.msg = 'Failed to update copies of bar-book in bar_shelf : ' + data3;
          } else {
            ret.err = 0;
          }
          cb(ret.err, ret);
        });
      } else {
        ret.err = errCode.DBQUERY;
        ret.msg = 'duplicated book-bar record in bar_shelf';
        cb(ret.err, ret);
      }
    }
  });
};

exports.BookDTO = BookDTO;
exports.getBookByIsbn = getBookByIsbn;
exports.getBookByBkIds = getBookByBkIds;
exports.addBookFromDouban = addBookFromDouban;
exports.addBookToBarShelf = addBookToBarShelf;
exports.removeBookFromBarShelf = removeBookFromBarShelf;

