var restify = require('restify');

function handler(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

var options = {
  // certificate:   // for https
  // key: ,         // for https
  // formatters: ,  // custom format for res.send()
  //log: ,          // bunyan 
  name: 'Hello Restify',         // default 'restify'
  //spdy: ,         // for node-spdy
  //version: ,      // default version for all routes
  //handleUpgrades: // default false
};

var server = restify.createServer(options);
server.get('/hello/:name', handler);
server.head('/hello/:name', handler);

server.listen(3011, function() {
  console.log('%s listening at %s', server.name, server.url);
});

