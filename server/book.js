var http = require('http');

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
  */
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
};
