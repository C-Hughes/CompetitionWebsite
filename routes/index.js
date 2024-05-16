
var express = require('express');
var router = express.Router();
var passport = require('passport');
var Competition = require('../models/competition');
var Basket = require('../models/basket');
var Order = require('../models/order');
var BillingAddress = require('../models/billingAddress');
var Ticket = require('../models/ticket');

/* GET home page. */
router.get('/', function(req, res, next) {
    var success = req.flash('success');
    Competition.find({})
      .then(foundCompetition => {
            res.render('index', {title: 'Giveaway Home', competitions: foundCompetition, areCompetitions: foundCompetition.length > 0, active: { home: true }, success: success, hasSuccess: success.length > 0});
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
    var errors = req.flash('error');
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {

        //For each item in the basket, lookup in DB how many tickets have been sold
        //Check if user can purchase any more tickets based on max tickets per competition
        //Check if user can purchase any more tickets based on max tickets per user
        //Update basket accordingly


        var basket = new Basket(req.session.basket);

        BillingAddress.findOne({userReference: req.user})
        .then(foundBAddress => {
            if (foundBAddress) {
                res.render('checkout', { title: 'Checkout', products: basket.generateArray(), totalPrice: basket.totalPrice, userBillingAddress: foundBAddress, error: errors, errors: errors.length > 0});
            } else {
                console.log("No Address Saved");
                res.render('checkout', { title: 'Checkout', products: basket.generateArray(), totalPrice: basket.totalPrice, error: errors, errors: errors.length > 0});
            }
        })
        .catch(err => {
            console.log(err);
        });
    }
});

router.get('/processCard', function(req, res, next) {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {

        //For each item in the basket, lookup in DB how many tickets have been sold
        //Check if user can purchase any more tickets based on max tickets per competition
        //Check if user can purchase any more tickets based on max tickets per user
        //Update basket accordingly

        var basket = new Basket(req.session.basket);
        res.render('processCard', { title: 'Pay with Card', totalPrice: basket.totalPrice});
    }
});

router.get('/orderReceived', function(req, res, next) {
    var success = req.flash('success');
    res.render('orderReceived', { title: 'Order Received', success: success, hasSuccess: success.length > 0 });
});

router.get('/competition/:id', function(req, res, next) {
    var compID = req.params.id;
    var error = req.flash('error');

    Competition.findOne({ _id: compID })
    .then((foundCompetition) => {
        if (foundCompetition) {
            res.render('competition', {title: 'Win This '+foundCompetition.title+'!', competition: foundCompetition, error: error, hasError: error.length > 0 });
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

        //For each item in the basket, lookup in DB how many tickets have been sold
        //Check if user can purchase any more tickets based on max tickets per competition
        //Check if user can purchase any more tickets based on max tickets per user
        //Update basket accordingly

        res.render('basket', { title: 'Basket', products: basket.generateArray(), totalPrice: basket.totalPrice});
    }
});

router.get('/addToBasket/:id/:answer/:qty', function(req, res, next) {
    var compID = req.params.id;
    var compAnswer = req.params.answer;
    var ticketQty = req.params.qty;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    if(compAnswer == "1"){
        req.flash('error', 'Please select an answer');
        res.redirect('/competition/'+compID+'');
    } else{
        Competition.findOne({ _id: compID })
        .then((foundCompetition) => {
            if (foundCompetition) {
                basket.add(foundCompetition, foundCompetition.id, compAnswer, ticketQty);
                req.session.basket = basket;
                res.render('competition', {title: 'Win This '+foundCompetition.title+'!', competition: foundCompetition, addedToBasket: true, ticketQty: ticketQty});
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
    }


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

        //Get BillingAddress Reference from UserID
        BillingAddress.findOne({userReference: req.user})
        .then(foundBAddress => {
            if (foundBAddress) {
                var order = new Order({
                    userReference: req.user,
                    orderNumber: '0000000001',
                    basket: basket,
                    billingAddressReference: foundBAddress._id,
                    paymentID: 'TESTREFERENCE',
                    paymentPrice: req.session.basket.totalPrice,
                });
                console.log('SAVE ORDER');
                order.save({})
                .then(() => {
                    console.log('SUCCESS SAVE ORDER');
                    //Next iterate through every item in the basket.
                    var competitionEntries = basket.generateArray();
                    //For each item:
                    competitionEntries.forEach(function(comp){
                        console.log('CompID ' + comp.item._id);
                        console.log('qty ' + comp.qty);
                        console.log('answer ' + comp.questionAnswer);

                        //Get a list of all ticket numbers sold for that competition
                        Competition.findOne({ _id: comp.item._id })
                        .then((foundCompetition) => {

                            if (foundCompetition) {
                                var soldCompTicketNumbers = foundCompetition.ticketNumbersSold;
                                var newTicketNumbers = [];
                                //var toGenerate = Array.from(Array(comp.qty).keys());

                                //Randomly generate a ticket for the qauntity purchased
                                //toGenerate.forEach(function(foundCompetition) {
                                //    var count = 0;

                                for(let i = 0; i< comp.qty; i++){
                                    //your code
                                 
                                    console.log('Tickets Generated'+i+'/'+comp.qty);

                                    var foundRandomNumber = false;
                                    //Check if that ticketnumber has already been purchased, if it has generate a new one.
                                    while(foundRandomNumber == false){
                                        //Generate random Ticket Number
                                        var randomTicketNumber = Math.floor(Math.random() * foundCompetition.maxEntries) + 1;
                                        console.log('RANDOM NUMBER '+randomTicketNumber);
                                        
                                        //if any tickets for the competition have been sold
                                        if(soldCompTicketNumbers.length!=0){
                                            console.log('TICKETS HAVE BEEN SOLD');

                                            //Loop through all tickets sold so far
                                            for (var j = 0; j < soldCompTicketNumbers.length; j++) {
                                                
                                                var duplicateFound = false;
                                                //If sold ticket number == the random ticket generated,
                                                if (soldCompTicketNumbers[j] == randomTicketNumber) {
                                                    duplicateFound = true;
                                                }
                                            }
                                            //If a duplicate has not been found, set foundRandomNumber to true
                                            if(duplicateFound == false){
                                                foundRandomNumber = true;
                                            }
                                        } else {
                                            //If no tickets have been sold so far
                                            console.log('NO TICKETS SOLD');
                                            foundRandomNumber = true;
                                        }
                                    }
                                    newTicketNumbers.push(randomTicketNumber);
                                    soldCompTicketNumbers.push(randomTicketNumber);
                                    console.log('UPDATE NEW TICKET NUMBERS '+newTicketNumbers);
                                    console.log('UPDATE COMP SOLD TICKET NUMBERS '+soldCompTicketNumbers);
                                //});
                                }
                                console.log('ALL TICKETS GENERATED');
                                //Save all ticket number in the tickets DB.
                                var ticketUpdate = {
                                    userReference: req.user,
                                    competitionReference: comp.item._id,
                                    orderReference: order._id,
                                    basket: basket,
                                    paymentID: order.paymentID,
                                    ticketQty: comp.qty,
                                    compAnswer: comp.questionAnswer,
                                    ticketNumbers: newTicketNumbers,
                                };
                                Ticket.findOneAndUpdate({userReference: req.user}, ticketUpdate, {upsert: true})
                                .then(() => {
                                    console.log('SAVED TICKETS IN TICKET DB');
                                    //Concart arrays - 
                                    //soldCompTicketNumbers = soldCompTicketNumbers.concat(newTicketNumbers);
                                    soldCompTicketNumbers = soldCompTicketNumbers.sort(function(a, b) {
                                        return a - b;
                                    });
                                    console.log('SORTED TICKETS SOLD ARRAY '+ soldCompTicketNumbers);
                                    //Update tickets sold to array in competitions DB entry
                                    var competitionTicketsUpdate = {
                                        ticketNumbersSold: soldCompTicketNumbers,
                                        $inc : {'currentEntries' : comp.qty},
                                    }
                                    Competition.findOneAndUpdate({_id: comp.item._id}, competitionTicketsUpdate, {upsert: false})
                                    .then(() => {
                                        console.log('SOLD TICKETS UPDATED IN COMPETITION DB '+comp.item.title);
                                    })
                                    .catch(err => {
                                        console.log(err);
                                    });
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                            } else {
                                req.flash('error', 'This competition does not exists.');
                                console.log('ERROR COMPETITION DOES NOT EXIST');
                                return res.redirect('/basket');
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    });
                    req.flash('success', 'Your purchase was successful');
                    console.log("Success Purchase Successful");
                    req.session.basket = null;
                    return res.redirect('/orderReceived');
                })
                .catch(err => {
                    console.log(err);
                });
            } else {
                console.log("No Address Saved");
                req.flash('error', 'Billing address error. Your billing address was not found. Order not saved.');
                res.redirect('/checkout');
            }
        })
        .catch(err => {
            console.log(err);
        });
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