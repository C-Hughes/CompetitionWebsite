var express = require('express');
var router = express.Router();


router.use('/'), isLoggedIn, function(req, res, next){
    next();
}

/* GET users listing. */
router.get('/', isLoggedIn, function(req, res, next) {
  res.render('user/dashboard', { title: 'My Account', active: { dashboard: true } });
});

router.get('/address', function(req, res, next) {
  res.render('user/address', { title: 'Addresses', active: { address: true } });
});

router.get('/accountDetails', function(req, res, next) {
  res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true } });
});

router.get('/rewards', function(req, res, next) {
  res.render('user/rewards', { title: 'Rewards', active: { rewards: true } });
});

router.get('/safePlaying', function(req, res, next) {
  res.render('user/safePlaying', { title: 'Safe Playing', active: { safePlaying: true } });
});



module.exports = router;


//Check if logged in
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    res.redirect('/');
  }

//Check if not logged in
function notLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      return next();
    }
    res.redirect('/');
}