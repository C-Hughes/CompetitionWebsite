var express = require('express');
var router = express.Router();

var Order = require('../models/order');
var Basket = require('../models/basket');
var BillingAddress = require('../models/billingAddress');


/* MUST BE LOGGED IN TO ACCESS BELOW */
router.use('/', isLoggedIn, function(req, res, next) {
    next();
});


/* GET users listing. */
router.get('/', function(req, res, next) {
    var foundOrders = "";
    Order.find({user: req.user})
    .then(foundOrders => {
        var basket;
        foundOrders.forEach(function(order){
            basket = new Basket(order.basket);
            order.items = basket.generateArray();
        });
    })
    .catch(err => {
        console.log(err);
    });
    res.render('user/dashboard', { title: 'My Account', active: { dashboard: true }, orders: foundOrders || ""});
});

router.get('/address', function(req, res, next) {
    var foundAddress = "";
    BillingAddress.find({user: req.user})
    .then(foundBAddress => {
        return res.render('user/address', { title: 'Addresses', billingAddress: foundBAddress, active: { address: true }});
    })
    .catch(err => {
        console.log(err);
    });
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
