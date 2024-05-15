var express = require('express');
var router = express.Router();

var Order = require('../models/order');
var Basket = require('../models/basket');
var BillingAddress = require('../models/billingAddress');
var User = require('../models/user');


/* MUST BE LOGGED IN TO ACCESS BELOW */
router.use('/', isLoggedIn, function(req, res, next) {
    next();
});


/* GET users listing. */
router.get('/', function(req, res, next) {
    Order.find({userReference: req.user})
    .then(foundOrders => {
        if (foundOrders) {
            var basket;
            foundOrders.forEach(function(order){
                basket = new Basket(order.basket);
                order.items = basket.generateArray();

                //If order item drawDate is in the past, add to past competitions, if not add to current.
                /*
                for (const key in order.items) {
                    if (order.items.hasOwnProperty(key)) {
                    const item = order.items[key];
                    console.log(`Item: ${JSON.stringify(item.item.title)}`);
                    //
                    }
                }
                */
            });

            return res.render('user/dashboard', { title: 'My Account', active: { dashboard: true }, orders: foundOrders, hasOrders: foundOrders.length > 0});
        } else {
            console.log("No Orders Found");
            return res.render('user/dashboard', { title: 'My Account', active: { dashboard: true }, orders: ""});
        }
    })
    .catch(err => {
        console.log(err);
    });
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
    var errors = req.flash('error');
    var success = req.flash('success');

    User.findOne({_id: req.user})
    .then(foundUser => {
        if (foundUser) {
            res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true }, userDetails: foundUser, error: errors, errors: errors.length > 0, success: success, successes: success.length > 0});
        } else {
            console.log("Error getting user details");
            res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true }, userDetails: "", error: errors, errors: errors.length > 0, success: success, successes: success.length > 0});
        }
    })
    .catch(err => {
        console.log(err);
    });
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
        if(req.body.emailAddress){
            req.checkBody('emailAddress', 'Email is not valid').isEmail();
        }
        if (req.body.DOBDD || req.body.DOBMM || req.body.DOBYY){
            req.checkBody('DOBDD', 'Date of Birth Day cannot be empty').notEmpty();
            req.checkBody('DOBMM', 'Date of Birth Month cannot be empty').notEmpty();
            req.checkBody('DOBYY', 'Date of Birth Year cannot be empty').notEmpty();
            req.checkBody('DOBDD', 'Date of Birth Day must be a Number').isInt();
            req.checkBody('DOBMM', 'Date of Birth Month must be a String').isString();
            req.checkBody('DOBYY', 'Date of Birth Year must be a Number').isInt();
        }    

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/address');
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
            DOB: new Date(''+req.body.DOBDD+'/'+req.body.DOBMM+'/'+req.body.DOBYY+''),
            DOBDD: req.body.DOBDD,
            DOBMM: req.body.DOBMM,
            DOBYY: req.body.DOBYY,
            emailAddress: req.body.emailAddress,
            lastUpdated: new Date().toISOString(),
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


router.post('/accountDetails/:form', function(req, res, next) {
    var form = req.params.form;

    console.log('HERE');

    if(form == "updateDetails"){
        //Input Validation
        req.checkBody('firstName', 'First Name cannot be empty').notEmpty();
        req.checkBody('lastName', 'Last Name cannot be empty').notEmpty();
        req.checkBody('displayName', 'Display Name cannot be empty').notEmpty();
        req.checkBody('emailAddress', 'Email Address cannot be empty').notEmpty();
        req.checkBody('DOBDD', 'Date of Birth Day cannot be empty').notEmpty();
        req.checkBody('DOBMM', 'Date of Birth Month cannot be empty').notEmpty();
        req.checkBody('DOBYY', 'Date of Birth Year cannot be empty').notEmpty();
        req.checkBody('DOBDD', 'Date of Birth Day must be a Number').isInt();
        req.checkBody('DOBMM', 'Date of Birth Month must be a String').isString();
        req.checkBody('DOBYY', 'Date of Birth Year must be a Number').isInt();
        

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/user/accountDetails');
        }
        
        var userDetailsUpdate = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            displayName: req.displayName,
            emailAddress: req.body.emailAddress,
            DOB: new Date(''+req.body.DOBDD+'/'+req.body.DOBMM+'/'+req.body.DOBYY+''),
            DOBDD: req.body.DOBDD,
            DOBMM: req.body.DOBMM,
            DOBYY: req.body.DOBYY,
            lastUpdated: new Date().toISOString(),
        };
        User.findOneAndUpdate({_id: req.user}, userDetailsUpdate, {upsert: false})
        .then(() => {
            req.flash('success', 'Your account details were updated');
            res.redirect('/user/accountDetails');
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        req.flash('error', 'Unknown Form Type');
        res.redirect('/user/accountDetails');
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
