
var express = require('express');
var router = express.Router();
var passport = require('passport');
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


// Login / Register //
router.get('/login', function(req, res, next) {
    var sMessages = req.flash('sError');
    var lMessages = req.flash('lError');
    var Errormessage = req.flash('error');

    if (Errormessage[0] == 'LOGIN Please populate required fields'){
        lMessages.push('Please populate required fields');
    } else if (Errormessage[0] == 'SIGNUP Please populate required fields'){
        sMessages.push('Please populate required fields');
    }

    res.render('login', { title: 'Login / Register', sMessages: sMessages, hasSErrors: sMessages.length > 0, lMessages: lMessages, hasLErrors: lMessages.length > 0});
});

router.post('/login', passport.authenticate('local.login', {
    successRedirect: '/user',
    failureRedirect: '/login',
    badRequestMessage : 'LOGIN Please populate required fields',
    failureFlash: true
}));

router.post('/register', passport.authenticate('local.signup', {
    successRedirect: '/user',
    failureRedirect: '/login',
    badRequestMessage : 'SIGNUP Please populate required fields',
    failureFlash: true
}));


///////////////////////////////////////////////////


router.get('/cart', function(req, res, next) {
    res.render('cart', { title: 'Basket' });
});

router.get('/checkout', function(req, res, next) {
    res.render('checkout', { title: 'Checkout' });
});

router.get('/orderReceived', function(req, res, next) {
    res.render('orderReceived', { title: 'Order Received' });
});

router.get('/competition/:id', function(req, res, next) {
    var compID = req.params.id;
    Competition.findOne({ _id: compID })
    .then((foundCompetition) => {
        if (foundCompetition) {
            res.render('competition', {title: 'Win This '+foundCompetition.title+'!', competition: foundCompetition});
        } else {
            //req.flash('error', 'This competition does not exists.');
            console.log("Not Found");
            res.redirect('/');
        }
      })
      .catch(err => {
        console.log(err);
    });
});


module.exports = router;
