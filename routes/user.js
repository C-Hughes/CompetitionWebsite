var express = require('express');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('user/dashboard', { title: 'My Account' });
});


module.exports = router;
