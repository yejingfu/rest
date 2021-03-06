var util2 = require('util');
var stream = require('stream');
var net = require('net');
var http = require('http');
var fs = require('fs-extra');
var path = require('path');
var errCode = require('./error').errCode;
var mysql = require('mysql');
var uuid = require('node-uuid');

console.log('create mysql pool...');
var pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'booker'
});

exports.dbPool = pool;
exports.imgFolder = '/opt/booker/storage';

exports.exeDBQuery = function (pool, sql, cb, showSQL) {
  if (showSQL)
    console.log('exeQuery:'+sql);
  var ret = {err: 0};
  var done = function() {
    if (typeof cb === 'function') {
      if (ret.err) {
        cb(ret.err, ret);
      } else {
        cb(errCode.OK, ret.data);
      }
    }
  };

  pool.getConnection(function(err, conn) {
    if (err) {
      ret = {err: errCode.DBCONN, msg: err};
      done();
    } else {
      conn.query(sql, function(err2, rows) {
        if (err2) {
          ret = {err: errCode.DBQUERY, msg: err2};
        } else {
          ret.data = rows;
        }
        conn.release();
        done();
      });
    }
  });
};

exports.downloadImage = function(url, cb) {
  var ret = {};
  var onFailed = function() {
    ret.err = errCode.FAILEDDOWNLOADIMAGE;
    ret.msg = 'Failed to download image';
    cb(ret.err, ret);
  };
  var idx, ext, imgName;
  idx = url.lastIndexOf('.');
  if (idx <= 0) return onFailed();
  ext = url.substr(idx);
  imgName = exports.genUUID() + ext;
  
  var client = http.get(url, function(res) {
    if (res.statusCode !== 200) {
      return onFailed();
    }
    
    var fileStream = fs.createWriteStream(path.join(exports.imgFolder, imgName));
    res.pipe(fileStream);
    
    res.on('end', function() {
      ret.err = 0;
      ret.image = imgName;
      cb(0, ret);
    });

    res.on('error', function() {
      console.log('failed');
      return onFailed();
    });
    
  });
  
  client.on('error', function(e){
    console.log('Failed to donwnload image:'+e.message);
    return onFailed();
  });
};

exports.getImageStreamByName = function(req, res, next) {
  var imgPath = path.join(exports.imgFolder, req.params.name||'unknown.png');
  var ret = {};
  var img;
  fs.exists(imgPath, function(yes) {
    if (yes) {
      img = fs.createReadStream(imgPath);
      res.setHeader('Content-Type', 'image/jpeg');
      img.pipe(res);
      
    } else {
      ret.err = errCode.APIIMAGENOTEXIST;
      ret.msg = 'Image does not exist!';
      res.setHeader('Content-Type', 'text/json');
      res.end(JSON.stringify(ret));
    }
  });
};

exports.saveBase64Image = function(body, cb) {
  var ret = {err: 0};
  var data = body.data;
  var ext = body.ext;
  var encode = body.encode;
  if (encode !== 'base64') {
    return cb({err: 1, msg: 'The data should be base64 encoded'});
  }
  var header = data.substring(0, 25);
  var idx  = header.indexOf('base64,');
  if (idx >= 0) {
    data = data.substring(idx + 7);
  }
  var imageName = uuid.v4() + '.' + ext || 'png';
  var imagePath = path.join(exports.imgFolder, imageName);
  fs.writeFile(imagePath, data, 'base64', function(err) {
    if (err) {
      cb({err: 3, msg: 'Failed to save image to disk'});
    } else {
      ret.name = imageName;
      return cb(ret);
    }
  });
};

exports.postImage = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  exports.saveBase64Image(req.body, function(ret) {
    res.end(JSON.stringify(ret));
  });
};

exports.encodeImage = function(filename, cb) {
  fs.readFile(path.join(exports.imgFolder, filename), function(err, data) {
    if (err) return cb(err, data);
    var base64str = data.toString('base64');
    cb(0, base64str);
  });
};

exports.getAllDistricts = function(req, res, next) {
  res.setHeader('Content-Type', 'text/json');
  var sql = 'select * from district';
  var ret = {}, idx, len;
  exports.exeDBQuery(pool, sql, function(err, data) {
    if (err) {
      ret.err = err;
      ret.msg = 'Failed to get district list';
      res.end(JSON.stringify(ret));
    } else {
      ret.err = 0;
      ret.districts = [];
      for (idx = 0, len = data.length; idx < len; idx++) {
        ret.districts.push(data[idx]);
      }
      res.end(JSON.stringify(ret));
    }
  });

};

exports.printObject = function(obj, name) {
  name = name || 'object';
  for (var k in obj) {
    //if (obj.hasOwnedProperty(k)) {
      console.log(name + '['+k+']: ' + obj[k]);
    //}
  }
};

exports.printReqHeaders = function(req) {
  console.log('-----begin request headers -----');
  for (var k in req.headers) {
    console.log('header['+k+']: ' + req.headers[k]);
  }
  console.log('------end request headers-----');
};

exports.printReqBody = function(req) {
  console.log('---- begin request body------');
  for (var k in req.body) {
    console.log('body['+k+']: ' + req.body[k]);
  }
  console.log('-----end request body -------');
};

exports.printUserList = function(users) {
  console.log('---print users: ' + users.length);
  var user;
  for (var i = 0, len = users.length; i < len; i ++) {
    user = users[i];
    for (var k in user) {
      console.log('user['+i+'].'+k+':'+user[k]);
    }
  }
};

exports.now = function() {
  return Math.floor((new Date()).getTime() / 1000);   // in milli-seconds from 1970.1.1
};

exports.genUUID = function() {
  return uuid.v4();
};

exports.convertArrayBufferToBuffer = function(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
};

exports.convertBufferToArrayBuffer = function(buf) {
  var len = buf.length;
  var ab = new ArrayBuffer(len, 0);
  var view = new Uint8Array(ab);
  for (var i = 0; i < len; i++) {
    view[i] = buf[i];
  }
  return ab;
};

exports.connectToServer = function(onConnected, onData, onEnd, onError) {
  var conn = net.connect({
    port: 8640,
    host: '121.199.58.239'
  }, function() { // get connected
    console.log('connect to server 121.199.58.239');
    if (typeof onConnected === 'function')
      onConnected(conn);
  });

  conn.on('data', function(chuck) {
    console.log('received data from server');
    if (typeof onData === 'function')
      onData(chuck);
  });

  conn.on('end', function() {
    console.log('connection disconnected');
    if (typeof onEnd === 'function')
      onEnd();
  });
  
  conn.on('error', function(err) {
    console.log('error occurs: '+ err);
    if (typeof onError === 'function')
      onError();
  });
};


// I turn the given source Buffer into a Readable stream.
var BufferStream = function( source ) {
    if ( ! Buffer.isBuffer( source ) ) {
        throw( new Error( "Source must be a buffer." ) );
    }
 
    // Super constructor.
    stream.Readable.call( this );
 
    this._source = source;
 
    // I keep track of which portion of the source buffer is currently being pushed
    // onto the internal stream buffer during read actions.
    this._offset = 0;
    this._length = source.length;
 
    // When the stream has ended, try to clean up the memory references.
    this.on( "end", this._destroy );
 
}
 
util2.inherits( BufferStream, stream.Readable );
 
 
// I attempt to clean up variable references once the stream has been ended.
// --
// NOTE: I am not sure this is necessary. But, I'm trying to be more cognizant of memory
// usage since my Node.js apps will (eventually) never restart.
BufferStream.prototype._destroy = function() {
 
    this._source = null;
    this._offset = null;
    this._length = null;
 
};
 
 
// I read chunks from the source buffer into the underlying stream buffer.
// --
// NOTE: We can assume the size value will always be available since we are not
// altering the readable state options when initializing the Readable stream.
BufferStream.prototype._read = function( size ) {
 
    // If we haven't reached the end of the source buffer, push the next chunk onto
    // the internal stream buffer.
    if ( this._offset < this._length ) {
 
        this.push( this._source.slice( this._offset, ( this._offset + size ) ) );
 
        this._offset += size;
 
    }
 
    // If we've consumed the entire source buffer, close the readable stream.
    if ( this._offset >= this._length ) {
 
        this.push( null );
 
    }
 
};

exports.BufferStream = BufferStream;

