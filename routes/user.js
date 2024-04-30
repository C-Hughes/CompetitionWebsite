var express = require('express');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('user/dashboard', { title: 'My Account', active: { dashboard: true } });
});

router.get('/address', function(req, res, next) {
  res.render('user/address', { title: 'Address', active: { address: true } });
});

router.get('/accountDetails', function(req, res, next) {
  res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true } });
});

router.get('/communicationPreferences', function(req, res, next) {
  res.render('user/communicationPreferences', { title: 'Communication Preferences', active: { communicationPreferences: true } });
});

router.get('/safePlaying', function(req, res, next) {
  res.render('user/safePlaying', { title: 'Safe Playing', active: { safePlaying: true } });
});


module.exports = router;
