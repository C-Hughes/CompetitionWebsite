
var express = require('express');
var router = express.Router();
var passport = require('passport');
var Competition = require('../models/competition');
var Basket = require('../models/basket');
var Order = require('../models/order');
var BillingAddress = require('../models/billingAddress');

/* GET home page. */
router.get('/', function(req, res, next) {
    Competition.find({})
      .then(foundCompetition => {
            res.render('index', {title: 'Giveaway Home', competitions: foundCompetition, active: { home: true }});
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

router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

router.get('/checkout', function(req, res, next) {
    //var messages = res.locals.message;//req.flash('error');
    var errors = req.flash('error');
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {
        var basket = new Basket(req.session.basket);
        res.render('checkout', { title: 'Checkout', products: basket.generateArray(), totalPrice: basket.totalPrice, error: errors, errors: errors.length > 0});
    }
});

router.get('/processCard', function(req, res, next) {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {
        var basket = new Basket(req.session.basket);
        res.render('processCard', { title: 'Pay with Card', totalPrice: basket.totalPrice});
    }
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

//////////////////////////// Basket Routes /////////////////////////////

router.get('/basket', function(req, res, next) {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.render('basket', { title: 'Basket', products: null});
    } else {
        var basket = new Basket(req.session.basket);
        //console.log(basket.generateArray());
        res.render('basket', { title: 'Basket', products: basket.generateArray(), totalPrice: basket.totalPrice});
    }
});

router.get('/addToBasket/:id/:answer/:qty', function(req, res, next) {
    var compID = req.params.id;
    var compAnswer = req.params.answer;
    var ticketQty = req.params.qty;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    Competition.findOne({ _id: compID })
    .then((foundCompetition) => {
        if (foundCompetition) {
            basket.add(foundCompetition, foundCompetition.id, compAnswer, ticketQty);
            req.session.basket = basket;
            res.render('competition', {title: 'Win This '+foundCompetition.title+'!', competition: foundCompetition, addedToBasket: true});
        } else {
            //req.flash('error', 'This competition does not exists.');
            console.log("Not Found");
            res.redirect('/');
        }
      })
      .catch(err => {
        console.log(err);
        res.redirect('/');
    });
});

router.get('/removeItem/:id', function(req, res, next) {
    var compID = req.params.id;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    basket.removeItem(compID);
    req.session.basket = basket;
    res.redirect('/basket');
});

router.get('/increaseOneItem/:id', function(req, res, next) {
    var compID = req.params.id;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    basket.increaseByOne(compID);
    req.session.basket = basket;
    res.redirect('/basket');
});

router.get('/reduceOneItem/:id', function(req, res, next) {
    var compID = req.params.id;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    basket.reduceByOne(compID);
    req.session.basket = basket;
    res.redirect('/basket');
});

///////////////////////////////////////////////////////////////////


////////////////////////// ROUTE POSTS ////////////////////////////

router.post('/processCard', function(req, res, next) {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {
        var basket = new Basket(req.session.basket);

        var order = new Order({
            userReference: req.user,
            basket: basket,
            billingAddressReference: {type: Schema.Types.ObjectId, ref: 'BillingAddress', required: true},
            paymentID: 'TESTREFERENCE',
            paymentPrice: req.session.basket.totalPrice,
        });
        order.save({})
        .then(() => {
            req.flash('success', 'Your purchase was successful');
            req.session.basket = null;
            res.redirect('/');
        })
        .catch(err => {
            console.log(err);
        });
        /*
            var newUser = new User();
                newUser.username = username;
                newUser.password = newUser.encryptPassword(passwordConf);
                newUser.email = email;
                newUser.firstName = firstName;
                newUser.lastName = lastName;
                newUser.joindate = new Date();
                newUser.lastlogin = new Date();
                newUser.save({})
                .then(() => {
                    return done(null, newUser);
                })
                .catch(err => {
                console.log(err);
                });
        */

    }
});

router.post('/checkout', function(req, res, next) {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {
        //var basket = new Basket(req.session.basket);
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
        
        var billingAddress = new BillingAddress({
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
        });
        billingAddress.save({})
        .then(() => {
            req.flash('success', 'Your billing details were saved');
            res.redirect('/processCard');
        })
        .catch(err => {
            console.log(err);
        });
    }
});


///////////////////////////////////////////////////////////////////

///////// Logged in users cannot access routes below //////////////

/* MUST BE LOGGED IN TO ACCESS BELOW */
router.use('/', notLoggedIn, function(req, res, next) {
    next();
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


module.exports = router;


//Check if not logged in
function notLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      return next();
    }
    res.redirect('/');
}