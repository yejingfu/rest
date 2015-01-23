var util2 = require('util');
var stream = require('stream');

exports.printObject = function(obj, name) {
  name = name || 'object';
  for (var k in obj) {
    console.log(name + '['+k+']: ' + obj[k]);
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

exports.convertArrayBufferToBuffer = function(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
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

