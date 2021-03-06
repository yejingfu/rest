var express = require('express');
var debug = require('debug')('client:server');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var bar = require('./routes/bar');
var book = require('./routes/book');

var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('imagepath', path.join(__dirname, 'public', 'images'));
app.set('imagepath', '/opt/booker/storage');
app.set('DBServerIP', '121.199.58.239');  // localhost

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));
// The bodyParser cannot parse file in form. Instead use multiparty for parse file fields.
app.use(bodyParser.json({limit: '10mb'}));  // parse post body as json format
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));  // parse "application/x-www-form-urlencoded"
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/book', book);
app.use('/bar', bar);
app.use('/uploadimage', routes.uploadimage);
app.use('/feedbacks/:uid', routes.getFeedbacks);

app.get('/recommend', routes.showRecommendation);
app.post('/recommend', routes.postRecommendation);

app.get('/book/category/:cat', function(req, res){
  var cat = req.params.cat || 0;
  var client = http.get('http://121.199.58.239:3011/book/category/'+cat, function(res2){
    res2.pipe(res);
  });
  client.on('error', function(e) {
    var ret = {err: 1, msg:'Failed to get books: ' + e};
    res.setHeader('Content-Type', 'text/json');
    res.end(JSON.stringify(ret));
  });
});

app.post('/book/category', function(req, res) {
  var bkid = req.body.bookid;
  var cat = req.body.category;
  var reqObj = {bookid: bkid, category: cat};
  console.log('update book category: ' + bkid + '--'+ cat);
  var ret = {err: 0, msg:'Success'};
  res.setHeader('Content-Type', 'text/json');
  
  var options = {
    hostname: 'localhost',    //'121.199.58.239',
    port: 3011,
    path: '/book/category2',
    method: 'POST'
  };
  var client = http.request(options, function(res2) {
    console.log('res status: ' + res2.statusCode);
    if (res2.statusCode === 200) {
      res.end(JSON.stringify(ret));
    } else {
      console.log('HEADERS: ' + JSON.stringify(res2.headers));
      ret.err = 2;
      ret.msg = 'failed to connect to server: ' + res2.statusCode;
      res.end(JSON.stringify(ret));
    }
  });
  client.on('error', function(e) {
    ret.err = 1;
    ret.msg = 'error: ' + e;
    res.end(JSON.stringify(ret));
  });
  client.write(JSON.stringify(reqObj));
  client.end();
});

bar.setApp(app);
routes.setApp(app);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler: no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// startup server...

var port = parseInt(process.env.PORT, 10) || 3000;
app.set('port', port);

var server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error('Port ' + port + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error('Port ' + port + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  debug('Listening on port ' + server.address().port);
  console.log('Listening on the port ' + server.address().port);
}

//module.exports = app;
