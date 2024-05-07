var express = require('express');
var router = express.Router();
var Competition = require('../models/competition');

/* GET home page. */
router.get('/', function(req, res, next) {
    Competition.find({})
      .then(foundCompetition => {
            res.render('index', {title: 'Giveaway Home', competitions: foundCompetition});
    })
      .catch(err => {
          console.log(err);
    });
});

router.get('/faq', function(req, res, next) {
    res.render('faq', { title: 'FAQ', active: { faq: true } });
});

router.get('/results', function(req, res, next) {
    res.render('drawResults', { title: 'Draw Results', active: { results: true } });
});

router.get('/winners', function(req, res, next) {
    res.render('winners', { title: 'Winners', active: { winners: true } });
});

router.get('/winner', function(req, res, next) {
    res.render('winner', { title: 'Winner', active: { winners: true } });
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login / Register'});
});

router.post('/login', function(req, res, next) {
    res.redirect('/user');
});

router.get('/cart', function(req, res, next) {
    res.render('cart', { title: 'Basket' });
});

router.get('/checkout', function(req, res, next) {
    res.render('checkout', { title: 'Checkout' });
});

router.get('/orderReceived', function(req, res, next) {
    res.render('orderReceived', { title: 'Order Received' });
});

router.get('/competition', function(req, res, next) {
    res.render('competition', { title: 'Win This...' });
});

module.exports = router;
