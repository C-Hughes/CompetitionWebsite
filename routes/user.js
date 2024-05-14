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
    var errors = req.flash('error');
    var success = req.flash('success');
    BillingAddress.findOne({userReference: req.user})
    .then(foundBAddress => {
        if (foundBAddress) {
            res.render('user/address', { title: 'Addresses', active: { address: true }, userBillingAddress: foundBAddress, error: errors, errors: errors.length > 0, success: success, successes: success.length > 0});
        } else {
            console.log("No Address Saved");
            res.render('user/address', { title: 'Addresses', active: { address: true }, userBillingAddress: "", error: errors, errors: errors.length > 0, success: success, successes: success.length > 0});
        }
    })
    .catch(err => {
        console.log(err);
    });
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

////////////////////// ROUTE POSTS //////////////////////////////

router.post('/address/:addressType', function(req, res, next) {
    var addressType = req.params.addressType;

    if(addressType == "billing"){
        //Input Validation
        req.checkBody('firstName', 'First Name cannot be empty').notEmpty();
        req.checkBody('lastName', 'Last Name cannot be empty').notEmpty();
        req.checkBody('countryRegion', 'Country / Region cannot be empty').notEmpty();
        req.checkBody('streetAddress1', 'Street Address 1 cannot be empty').notEmpty();
        req.checkBody('townCity', 'Town / City cannot be empty').notEmpty();
        req.checkBody('postcode', 'Postcode cannot be empty').notEmpty();
        if(req.body.email){
            req.checkBody('email', 'Email is not valid').isEmail();
        }        

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/checkout');
        }
        
        var billingAddressUpdate = {
            userReference: req.user,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            countryRegion: req.body.countryRegion,
            streetAddress1: req.body.streetAddress1,
            streetAddress2: req.body.streetAddress2,
            townCity: req.body.townCity,
            county: req.body.county,
            postcode: req.body.postcode,
            phoneNumber: req.body.phoneNumber,
        };
        BillingAddress.findOneAndUpdate({userReference: req.user}, billingAddressUpdate, {upsert: true})
        .then(() => {
            req.flash('success', 'Your billing details were saved');
            res.redirect('/user/address');
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        req.flash('error', 'Unknown Address Type');
        res.redirect('/user/address');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////


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
