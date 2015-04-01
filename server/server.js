var restify = require('restify');
var md5 = require('js-md5');
var user = require('./user');
var test = require('./test');
var logviewer = require('./logviewer');
var login = require('./login');
var book = require('./book');
var bar = require('./bar');
var util = require('./util');

var exec = require('child_process').exec;

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

server.get('/md5/:digest', function(req, res, next) {
  var digest = req.params.digest;
  var output = md5(digest);
  var ret = {err:0, md5: output};
  res.setHeader('Content-Type', 'text/json');
  res.end(JSON.stringify(ret));
  next();
});

server.post('/test', function(req, res, next) {
  res.end('post /test done!');
});

server.get('/jeff/:action', function(req, res, next){
  var action = req.params.action;
  if (action == 2) {
    exec('/opt/booker/repo/booker/deploy/restart_middleware.sh', function(err){
      res.end('Done: ' + err);
    });
  } else {
    res.end('What do you want?');
  }
});

server.get('/hello/:name', hello_handler);
server.head('/hello/:name', hello_handler);

server.get('/user/:phone', user.handle);
server.post('/user/:phone', user.handle);
server.put('/user/:phone', user.handle);
server.del('/user/:phone', user.handle);

// output: [[friendId, rename, updated_ts, phone, nickname, avatar, gender, signature, birthday, hobby, job, edu, fav_book, fav_author]]
server.get('/user/friends/:uid', user.getFriendList);

// input: uid-- current user ID, friendid -- friend user ID (or group ID)
// output: list of message:
// [mid, relateid, fromuid, touid, content, status, createdts]
server.get('/user/unreadmessages/:uid', user.getUnreadMessage);

// input: uid -- current user ID, relateid -- the session is the chatting between two users
server.get('/user/clearunreadmessage/:uid', user.clearUnReadMessage);

// input: uid -- current user ID
// output: the list of groups which the current participate in.
// [[groupId, groupName, groupTopic, groupType, ownerId, barId]]
server.get('/user/groups/:uid', user.getGroups);

// input uid -- the user who sent the feedbacks. If uid is empty, return all feedbacks
// output -- array of feedbacks:
// [[id, uid, content, createdts], ...]
server.get('/user/feedbacks/:uid', user.getFeedbacks);

server.get('/profile/:uid', user.getProfile);
// update user profile, the request body contains profile information:
// {
//   uid: user-id, nickname: 'XXX', gender: 1/2, birthday: 'XXX', signature:'XXXX', hobby: 'XXX',
//   job: 'XXX', edu: 'XXX', favoriteauthor: 'XXX', favoritebook: 'XXX',
//   avatar: '0/1', avatardata: 'base64-image', avatarext: 'png|jpg'
// }
// if "avatar" is 0, do not update avatar, else update the avatar using base64-encoded "avatardata"
server.post('/profile/:uid', user.setProfile);
server.post('/profile2/:uid', user.setProfile2);

// reset password, input:
// {phone: phone, pwd: password, magic: PasSWoRd}
server.post('/resetpwd', user.resetpwd);


server.get('/users', user.list);

server.get('/test/:target', test.run);

server.get('/log/:service', logviewer.readlog);

server.post('/login/register', login.register);
server.post('/login/sendcheckcode', login.sendCheckCode);
server.post('/login/login', login.login);

// Book APIs
server.get('/bookcategory', book.getBookCat);
server.get('/book/test', book.test);
server.get('/book/isbn/:isbn', book.getBookByISBN);
// add a book into DB, bind in to bar and user
// body: isbn(string), barid(int), uid(int), bcat(int)
server.post('/book/add', book.addBook);
// body: barid(int), bisbn(string), uid(int), uisbn(string), ubookcat(int)
server.post('/book/exchange', book.exchangeBook);

// Get all books by category: cat(int), if cat is a nagetive, return all books.
server.get('/book/category/:cat', book.getBookByCategory);

// update book category: bookid(int), category(int)
server.post('/book/category', book.updateCategory);
server.post('/book/category2', book.updateCategory2); // used for client only

server.post('/recommendation', book.addBookRecommendation);
server.get('/recommendation', book.getBookRecommendation);
server.get('/recommendation2', book.getBookRecommendation2);


// get bar information by id
server.get('/bar/id/:id', bar.getBarById);
// get all bars inside of the district
server.get('/bar/district/:districtid', bar.getBarByDistrictId);
// get all bars
server.get('/bar/all', bar.getAllBars);
// get all bar ids
server.get('/bar/allids', bar.getAllBarIds);
// add bar information by POST REST call (experimental)
server.post('/bar', bar.addBar);
// add bar information from REST client
server.post('/bar2', bar.addBar2);
server.post('/updatebar2', bar.updateBar2);
// get all books from bar, inputs: `barid` and `bookcat`
server.get('/bar/books', bar.getAllBooks);

// Get user id list who like this bar
// input: id(bar id)
// ouput: array of user id
server.get('/bar/likes/:id', bar.getAllLikes);
// Call it if some user like this bar
// input: barid(bar id), userid(user id)
// output: error code 
server.post('/bar/like', bar.likeBar);
// Call it if some user dislike this bar
// input barid(bar id), userid(user id)
// output: error code
server.post('/bar/dislike', bar.dislikeBar);
// Get user id list who recently come in this bar
// input: id(bar id)
// output: array of user information, example:
// ids would be include user basic info, like blow:
//[['id1', 'phone', 'status', 'nickname', 'gender', 'birthday', 'signature', 'hobby', 'job', 'edu',
//  'favoriteauthor', 'favoritebook', 'avatar', 'createdts'], [...]]
server.get('/bar/customers/:id', bar.getAllCustomers);
// Call it if some user comes into this bar
// input: barid(bar id), userid(user id)
// output: error code
server.post('/bar/enter', bar.enter);

server.get('/districts', util.getAllDistricts);

server.get('/image/:name', util.getImageStreamByName);
server.post('/image', util.postImage);

server.listen(3011, function() {
  console.log('%s listening at %s', server.name, server.url);
});

