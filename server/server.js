var restify = require('restify');
var user = require('./user');

var options = {
  // certificate:   // for https
  // key: ,         // for https
  // formatters: ,  // custom format for res.send()
  //log: ,          // bunyan 
  name: 'Restify DEMO',         // default 'restify'
  //spdy: ,         // for node-spdy
  //version: ,      // default version for all routes
  //handleUpgrades: // default false
};
var server = restify.createServer(options);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.urlEncodedBodyParser());

server.use(restify.bodyParser());   // IMPORTANT!!!!

function hello_handler(req, res, next) {
  res.send('['+req.method+']: hello ' + req.params.name);
  next();
}

server.get('/hello/:name', hello_handler);
server.head('/hello/:name', hello_handler);

server.get('/user/:phone', user.handle);
server.post('/user/:phone', user.handle);
server.put('/user/:phone', user.handle);
server.del('/user/:phone', user.handle);

server.get('/profile/:uid', user.getProfile);
server.post('/profile/:uid', user.setProfile);


server.get('/users', user.list);

server.listen(3011, function() {
  console.log('%s listening at %s', server.name, server.url);
});

