var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.render('bar', { title: 'Booker-bar' });
});

module.exports = router;
