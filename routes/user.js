var express = require('express');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('user/dashboard', { title: 'My Account' });
});

router.get('/address', function(req, res, next) {
  res.render('user/address', { title: 'Address' });
});

router.get('/accountDetails', function(req, res, next) {
  res.render('user/accountDetails', { title: 'Account Details' });
});

router.get('/communicationPreferences', function(req, res, next) {
  res.render('user/communicationPreferences', { title: 'Communication Preferences' });
});

router.get('/safePlaying', function(req, res, next) {
  res.render('user/safePlaying', { title: 'Safe Playing' });
});


module.exports = router;
