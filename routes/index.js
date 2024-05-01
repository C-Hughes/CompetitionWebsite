var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Giveaway' });
});

router.get('/competition', function(req, res, next) {
  res.render('competition', { title: 'Win This...' });
});

router.get('/faq', function(req, res, next) {
  res.render('faq', { title: 'FAQ' });
});

router.get('/results', function(req, res, next) {
  res.render('results', { title: 'Draw Results' });
});

router.get('/cart', function(req, res, next) {
  res.render('cart', { title: 'Basket' });
});

module.exports = router;
