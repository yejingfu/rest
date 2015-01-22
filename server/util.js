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

