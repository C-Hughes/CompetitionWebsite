var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Giveaway', active: { home: true } });
});

router.get('/faq', function(req, res, next) {
  res.render('faq', { title: 'FAQ', active: { faq: true } });
});

router.get('/results', function(req, res, next) {
  res.render('results', { title: 'Draw Results', active: { results: true } });
});

router.get('/winners', function(req, res, next) {
  res.render('winners', { title: 'Winners', active: { winners: true } });
});


router.get('/cart', function(req, res, next) {
  res.render('cart', { title: 'Basket' });
});

router.get('/competition', function(req, res, next) {
  res.render('competition', { title: 'Win This...' });
});

module.exports = router;
