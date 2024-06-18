var express = require('express');
var router = express.Router();
var passport = require('passport');
const fs = require('fs');

var Competition = require('../models/competition');
var Basket = require('../models/basket');
var Order = require('../models/order');
var BillingAddress = require('../models/billingAddress');
var Ticket = require('../models/ticket');
var User = require('../models/user');
var Winner = require('../models/winner');
var DrawResult = require('../models/drawResults');
var Coupon = require('../models/coupon');

/* GET home page. */
router.get('/', async (req, res, next) => {
    try {
        const success = req.flash('success');
        const foundCompetition = await Competition.find({});
        const foundWinnerCards = await Winner.find({pinned: true}).limit(9);

        res.render('index', {
            title: 'Giveaway Home',
            competitions: foundCompetition,
            areCompetitions: foundCompetition.length > 0,
            winners: foundWinnerCards,
            active: { home: true },
            success: success,
            hasSuccess: success.length > 0
        });
    } catch (err) {
        console.log(err);
        next(err);  // Pass the error to the error handling middleware
    }
});

router.get('/faq', function(req, res, next) {
    res.render('faq', { title: 'FAQ', active: { faq: true } });
});

router.get('/results', function(req, res, next) {
    DrawResult.find({}).populate('competitionReference')
    .then(foundResults => {
        res.render('drawResults', {title: 'Draw Results', active: { results: true }, drawResults: foundResults, hasDrawResults: foundResults.length > 0});
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/drawResult/:id', function(req, res, next) {
    var drawResultID = req.params.id;

    DrawResult.findOne({ _id: drawResultID}).populate('competitionReference')
    .then(foundResult => {
        res.render('drawResult', {title: 'Draw Result - '+foundResult.title, active: { results: true }, drawResult: foundResult, hasDrawResult: foundResult.length > 0});
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/winners', async (req, res, next) => {
    try {
        const foundPinned = await Winner.find({pinned: true}).limit(9);
        const foundWinners = await Winner.find({pinned: false}).limit(24);

        if (foundWinners) {
            res.render('winners', { 
                title: 'Winners', 
                active: { winners: true }, 
                pinned: foundPinned,
                winners: foundWinners 
            });
        } else {
            console.log("Winners not Found");
            res.redirect('/');
        }
    } catch (err) {
        console.log(err);
        next(err);  // Pass the error to the error handling middleware
    }
});

router.get('/winner/:id', function(req, res, next) {
    var winnerID = req.params.id;

    Winner.findOne({ _id: winnerID})
    .then((foundWinner) => {
        if (foundWinner) {
            res.render('winner', {title: foundWinner.title, active: { winners: true }, winner: foundWinner});
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

router.get(['/termsandconditions', '/terms&conditions', '/t&cs','/tandcs'], function(req, res, next) {
    res.render('termsAndConditions', { title: 'Terms and Conditions'});
});

router.get('/privacyPolicy', function(req, res, next) {
    res.render('privacyPolicy', { title: 'Privacy Policy'});
});

router.get('/websiteTerms', function(req, res, next) {
    res.render('websiteTerms', { title: 'Website Terms'});
});

router.get('/responsiblePlaying', function(req, res, next) {
    res.render('responsiblePlaying', { title: 'Responsible Playing'});
});

router.get('/websiteSecurity', function(req, res, next) {
    res.render('websiteSecurity', { title: 'Website Security'});
});

router.get('/logout', function(req, res, next) {
    if (req.isAuthenticated()) {
        const userId = req.user._id;
        const userBasket = req.session.basket;

        User.findByIdAndUpdate(userId, { basket: userBasket })
        .then((updatedUser) => {
            //console.log(updatedUser);
            req.logout(function(err) {
                if (err) { return next(err); }
                res.redirect('/');
            });
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        res.redirect('/');
    }
});

router.get('/competition/:id', async (req, res, next) => {
    try {
        const compID = req.params.id;
        const error = req.flash('error');

        const foundCompetition = await Competition.findOne({ _id: compID });
        const foundTickets = await Ticket.findOne({ userReference: req.user._id, competitionReference: compID });
        var userCompTicketQty = 0;
        if (foundTickets){
            userCompTicketQty = foundTickets.ticketQty;
        }
        
        if (foundCompetition) {
            res.render('competition', {title: 'Win This ' + foundCompetition.title + '!', competition: foundCompetition, userCompTicketQty: userCompTicketQty, error: error, hasError: error.length > 0});
        } else {
            console.log("Not Found");
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        next(err); // Call next middleware with error to handle it properly
    }
});

//////////////////////////// Basket Routes /////////////////////////////

router.get('/basket', saveRedirectURL, async function(req, res, next) {
    var error = req.flash('error');
    const success = req.flash('success');

    try {
        if (!req.session.basket || req.session.basket.basketSubtotalPrice == 0) {
            return res.render('basket', { title: 'Basket', products: null });
        } else {
            var basket = new Basket(req.session.basket);
            var basketErrors = await basket.updateBasket(req.user); // Update the basket

            //Merge Error messages
            error = error.concat(basketErrors);

            req.session.basket = basket;
            res.render('basket', { title: 'Basket', products: basket.generateArray(), totalPrice: basket.basketTotalPrice, subtotalPrice: basket.basketSubtotalPrice, basketCoupons: basket.basketCouponsApplied, error: error, hasError: error.length > 0, success: success, hasSuccess: success.length > 0});
        }
    } catch (error) {
        console.log('Error updating basket:', error);
        res.redirect('/');
    }
});

router.get('/addToBasket/:id/:answer/:qty', async function(req, res, next) {
    try {
        var compID = req.params.id;
        var compAnswer = req.params.answer;
        var ticketQty = req.params.qty;
        var basket = new Basket(req.session.basket ? req.session.basket : {});

        if (compAnswer == "1") {
            req.flash('error', 'Please select an answer');
            res.redirect('/competition/' + compID);
        } else {
            var ONE_HOUR = 60 * 60 * 1000; // milliseconds
            const foundCompetition = await Competition.findOne({ _id: compID  });

            if (foundCompetition) {
                const foundAdditionalCompetition = await Competition.findOne({ _id: {$ne: compID}, active: true, visible: true, entryCloseDate: { $gt: Date.now() }});

                if (foundCompetition.active && foundCompetition.visible && new Date(foundCompetition.entryCloseDate.getTime()) > Date.now() && ((foundCompetition.currentEntries + foundCompetition.pendingEntries) < foundCompetition.maxEntries)) {
                    //Add to basket
                    basket.add(foundCompetition, foundCompetition.id, compAnswer, ticketQty);
                    req.session.basket = basket;

                    //Get a different competition to display on added to basket modal popup.
                    if (foundAdditionalCompetition) {
                        //console.log('Got one' + foundAdditionalCompetition.title);
                        res.render('competition', {
                            title: 'Win This ' + foundCompetition.title + '!',
                            competition: foundCompetition,
                            addedToBasket: true,
                            ticketQty: ticketQty,
                            error: [],
                            hasError: false,
                            additionalCompetition: foundAdditionalCompetition
                        });
                    } else {
                        //console.log('Not found one');
                        res.render('competition', {
                            title: 'Win This ' + foundCompetition.title + '!',
                            competition: foundCompetition,
                            addedToBasket: true,
                            ticketQty: ticketQty,
                            additionalCompetition: ""
                        });
                    }
                } else if (new Date(foundCompetition.entryCloseDate.getTime()) < Date.now()) {
                    req.flash('error', 'Entries to this competition have now closed');
                    console.log("Add to basket: Draw DateTime is within hour and now closed");
                    res.redirect('/basket');
                } else if ((foundCompetition.currentEntries + foundCompetition.pendingEntries) >= foundCompetition.maxEntries) {
                    req.flash('error', 'Entries to this competition have now sold out');
                    console.log("Add to basket: Competition is sold out");
                    res.redirect('/basket');
                } else {
                    req.flash('error', 'You cannot purchase tickets for this competition');
                    console.log("Add to basket: Competition is not active or not visible");
                    res.redirect('/basket');
                }
            } else {
                console.log("Not Found");
                res.redirect('/');
            }
        }
    } catch (err) {
        console.log(err);
        res.redirect('/');
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

router.get('/removeCoupon/:couponCode', function(req, res, next) {
    var couponCode = req.params.couponCode;
    var basket = new Basket(req.session.basket ? req.session.basket : {});

    basket.removeCoupon(couponCode);
    req.session.basket = basket;
    res.redirect('/basket');
});

router.post('/applyCoupon', async (req, res, next) => {
    try {
        //Lookup couponCode
        var returnedCoupon = await Coupon.findOne({ "couponCode" : { $regex : new RegExp('^'+req.body.couponCode+'$', "i") }}).populate('competitionReference');
        if(!returnedCoupon){
            req.flash('error', 'Coupon Code Not Found');
        } else {
            var basket = new Basket(req.session.basket ? req.session.basket : {});
            basket.addCoupon(returnedCoupon.couponCode);
            var basketErrors = await basket.updateBasket(req.user); // Update the basket
            req.session.basket = basket;

            if(basketErrors.length == 0){
                req.flash('success', 'Coupon Applied to Basket');
            } else {
                req.flash('error', basketErrors);
            }
        }

        if(req.session.oldUrl){
            var redirect = req.session.oldUrl;
            req.session.oldUrl = null;
            return res.redirect(redirect);
        } else {
            return res.redirect('/basket');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Applying Coupon');
        if(req.session.oldUrl){
            var redirect = req.session.oldUrl;
            req.session.oldUrl = null;
            return res.redirect(redirect);
        } else {
            return res.redirect('/basket');
        }
    }
});
/////////////////////////////////////////////////////////////////////////////
////////////////////// Basket Checkout/Payment/OrderReceived ////////////////////////////////

//Must be logged in to access checkout
router.get('/checkout', saveRedirectURL, isLoggedIn, isNotBanned, async (req, res, next) => {
    var error = req.flash('error');
    try {
        if (!req.session.basket || req.session.basket.basketSubtotalPrice == 0) {
            return res.redirect('/basket');
        }

        var basket = new Basket(req.session.basket);
        var basketErrors = await basket.updateBasket(req.user);
        //Merge Error messages
        error = error.concat(basketErrors);
        req.session.basket = basket;

        let foundBAddress = await BillingAddress.findOne({ userReference: req.user });

        if (foundBAddress) {
            res.render('checkout', {
                title: 'Checkout',
                products: basket.generateArray(),
                totalPrice: basket.basketTotalPrice,
                subtotalPrice: basket.basketSubtotalPrice,
                basketCoupons: basket.basketCouponsApplied,
                userBillingAddress: foundBAddress,
                error: error,
                hasError: error.length > 0
            });
        } else {
            console.log("No Address Saved");
            res.render('checkout', {
                title: 'Checkout',
                products: basket.generateArray(),
                totalPrice: basket.basketTotalPrice,
                subtotalPrice: basket.basketSubtotalPrice,
                basketCoupons: basket.basketCouponsApplied,
                error: error,
                hasError: error.length > 0
            });
        }
    } catch (err) {
        console.log('Error checking price:', err);
        res.redirect('/');
    }
});

router.get('/processCard', saveRedirectURL, isLoggedIn, isNotBanned, async (req, res, next) => {
    try {
        if (!req.session.basket || req.session.basket.basketSubtotalPrice == 0 || req.session.basket.basketTotalPrice == 0) {
            return res.redirect('/basket');
        }

        var basket = new Basket(req.session.basket);
        var basketErrors = await basket.updateBasket(req.user);
        req.session.basket = basket;

        if(basketErrors.length > 0){
            //Basket has changed, redirect and display message.
            req.flash('error', basketErrors);
            return res.redirect('/basket');
        }

        res.render('processCard', { title: 'Pay with Card', totalPrice: basket.basketTotalPrice });
    } catch (err) {
        console.log('Error checking price:', err);
        res.redirect('/');
    }
});

router.get('/orderReceived', function(req, res, next) {
    var success = req.flash('success');

    Order.findOne({userReference: req.user}, {}, { sort: { 'created' : -1 } })
    .then(foundOrder => {
        if (foundOrder) {
            var basket;
            basket = new Basket(foundOrder.basket);
            foundOrder.items = basket.generateArray();

            //console.log('foundOrder'+foundOrder);

            return res.render('orderReceived', { title: 'Order Received', order: foundOrder, success: success, hasSuccess: success.length > 0});
        } else {
            console.log("No Order Found");
            return res.render('orderReceived', { title: 'Order Received', order: "", success: success, hasSuccess: success.length > 0});
        }
    })
    .catch(err => {
        console.log(err);
    });
});

////////////////////// Route to fetch images ////////////////////////////////
router.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    //const imagePath = path.join(__dirname, 'routesuploads/', imageName);
    const imagePath = __dirname + '/../imageUploads/' + imageName;
  
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send('Image not found');
      }
      res.sendFile(imageName, {'root': __dirname + '/../imageUploads/'});
    });
});

///////////////////////////////////////////////////////////////////


////////////////////////// ROUTE POSTS ////////////////////////////

router.post('/checkout', isLoggedIn, isNotBanned, async (req, res, next) => {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    }
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
        //req.checkBody('DOBMM', 'Date of Birth Month must be a String').isString();
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
    try {
        const foundBAddress = await BillingAddress.findOneAndUpdate({ userReference: req.user }, billingAddressUpdate, { upsert: true, new: true });
        //req.flash('success', 'Your billing details were saved');
        
        const basket = new Basket(req.session.basket);
        var competitionEntries = basket.generateArray();
        const order = new Order({
            userReference: req.user,
            basket: competitionEntries,
            billingAddressReference: foundBAddress._id,
            billingAddress: foundBAddress,
            paymentID: '-',
            orderStatus: 'Pending',
            couponCodeUsed: req.session.basket.basketCouponsApplied,
            paymentSubtotalPrice: req.session.basket.basketSubtotalPrice,
            paymentPrice: req.session.basket.basketTotalPrice,
        });
        const savedOrder = await order.save();

        //Go through each competition in basket.
        for (let comp of competitionEntries) {
            //Get competition from basket item
            const foundCompetition = await Competition.findOne({ _id: comp.item._id });
            if (!foundCompetition) {
                req.flash('error', 'This competition does not exist.');
                console.log('/Checkout POST - ERROR COMPETITION DOES NOT EXIST');
                return res.redirect('/basket');
            }

            ///////////////UPDATE COMPETITION RECORD - ADD TICKET QTY TO pendingEntries count/////////////////
            var competitionPendingUpdate = {
                $inc: { 'pendingEntries': comp.qty },
                lastUpdated: new Date().toISOString(),
            };
            await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
        }



        //IF ORDER TOTAL = 0,
        //Complete order & redirect to orderReceived.



        //Start Timer to check if order
        startPendingOrderTimer(savedOrder._id);
        res.redirect('/processCard');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred during checkout');
        res.redirect('/checkout');
    }
});


router.post('/processCard', isLoggedIn, isNotBanned, async (req, res, next) => {
    if (!req.session.basket || req.session.basket.totalPrice == 0){
        return res.redirect('/basket');
    } else {
        try {


            var basket = new Basket(req.session.basket);
            var competitionEntries = basket.generateArray();
            var basketErrors = await basket.updateBasket(req.user);
            req.session.basket = basket;
            
            await checkBasketPendingOrder(req, res, next);

            /*
            if(basketErrors.length > 0){
                basketErrors.unshift('Your basket changed before payment was made. You have not been charged. Please try again.');
                req.flash('error', basketErrors);
                return res.redirect('/basket');
            }

            // Get BillingAddress Reference from UserID
            const foundBAddress = await BillingAddress.findOne({ userReference: req.user });
            if (!foundBAddress) {
                console.log("No Address Saved");
                req.flash('error', 'Billing address error. Your billing address was not found. Order not saved.');
                return res.redirect('/checkout');
            }

            //Find users most recent Order that has a status of pending
            const savedOrder = await Order.findOne({ userReference: req.user, orderStatus: 'Pending'}).sort({ created: -1 });
            if (!savedOrder) {
                console.log("No Order Found");
                req.flash('error', 'No pending order found. Please complete all orders within 10 minutes. Please try again.');
                return res.redirect('/checkout');
            } else {
                //If found, check basket to make sure price and qty match, otherwise there is an error.
                if(competitionEntries.totalPrice != savedOrder.basket.totalPrice || competitionEntries.totalQty != savedOrder.basket.totalQty || competitionEntries.length != savedOrder.basket.length){
                    req.flash('error', 'Order error. Your pending order record & basket do not match. Pending order has been cancelled. Please try again.');
                    
                    //If basket and found order basket do not match, cancel the order and remove 
                    await Order.findOneAndUpdate({ _id: savedOrder._id }, { orderStatus: 'Cancelled' }, { upsert: false });

                    for (let comp of competitionEntries) {
                        //Get competition from basket item
                        const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                        if (!foundCompetition) {
                            req.flash('error', 'This competition does not exist.');
                        }

                        ///////////////UPDATE COMPETITION RECORD - SUB TICKET QTY FROM pendingEntries count/////////////////
                        var competitionPendingUpdate = {
                            $inc: { 'pendingEntries': -comp.qty },
                            lastUpdated: new Date().toISOString(),
                        };
                        console.log('Cancelled - Competition qty to reduce = '+comp.qty);
                        await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
                    }
                    return res.redirect('/checkout');
                }
            }

            */

            //If order found and basket is the same, generate ticket numbers and update competitions info
            for (let comp of competitionEntries) {
                const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                if (!foundCompetition) {
                    req.flash('error', 'This competition does not exist.');
                    console.log('ERROR COMPETITION DOES NOT EXIST');
                    return res.redirect('/basket');
                }

                var soldCompTicketNumbers = foundCompetition.ticketNumbersSold;
                var ticketOrderObjArray = [];
                var newTicketNumbers = [];

                //console.log('Generating - ' + comp.qty + ' - Tickets');
                for (let i = 0; i < comp.qty; i++) {
                    //console.log('Tickets Generated ' + i + '/' + comp.qty);
                    let foundRandomNumber = false;
                    while (!foundRandomNumber) {
                        var randomTicketNumber = Math.floor(Math.random() * foundCompetition.maxEntries) + 1;
                        //console.log('RANDOM NUMBER ' + randomTicketNumber);

                        if (soldCompTicketNumbers.length === 0 || !soldCompTicketNumbers.includes(randomTicketNumber)) {
                            foundRandomNumber = true;
                        } else {
                            console.log('Duplicate ticketnumber generated, finding a new one - ' + randomTicketNumber);
                        }
                    }

                    //Update arrays of sold ticket numbers
                    newTicketNumbers.push(randomTicketNumber);
                    soldCompTicketNumbers.push(randomTicketNumber);

                    var ticketObj = {};
                    ticketObj["orderID"] = savedOrder.id;
                    ticketObj["ticketNumber"] = randomTicketNumber;
                    ticketOrderObjArray.push(ticketObj);
                }

                //Sort newTicketNumbers lowest to highest
                newTicketNumbers = newTicketNumbers.sort((a, b) => a - b);
                //Update comp.ticketNumbers to update the basket for orderReceived Page
                comp.ticketNumbers = newTicketNumbers;

                //Sort ticketOrderObjArray lowest to highest
                //ticketOrderObjArray.sort((a, b) => parseFloat(a.ticketNumber) - parseFloat(b.ticketNumber));

                var ticketUpdate = {
                    userReference: req.user,
                    competitionReference: comp.item._id,
                    competitionTitle: comp.item.title,
                    competitionDrawDate: comp.item.drawDate,
                    $inc: { ticketQty: comp.qty },
                    compAnswer: comp.questionAnswer,
                    $push: { 
                        ticketNumbers: { $each: newTicketNumbers },
                        ticketNumbersObjects: { $each: ticketOrderObjArray }
                    },
                    //mostRecentlyPurchasedTicketNumbers: newTicketNumbers,
                    lastUpdated: new Date().toISOString(),
                };
                await Ticket.findOneAndUpdate(
                    { userReference: req.user, compAnswer: comp.questionAnswer },
                    ticketUpdate,
                    { upsert: true }
                );

                ///////////////UPDATE COMPETITION RECORD FOR MOST RECENT PURCHASED TICKETS/////////////////
                //Sort all sold tickets for the competition to update in the database
                soldCompTicketNumbers = soldCompTicketNumbers.sort((a, b) => a - b);
                var competitionTicketsUpdate = {
                    ticketNumbersSold: soldCompTicketNumbers,
                    $inc: {
                        'currentEntries': comp.qty,
                        'pendingEntries': -comp.qty
                    },
                    lastUpdated: new Date().toISOString(),
                };
                console.log('Complete - Competition qty to reduce = '+comp.qty);
                //Update competition to include purchased ticket numbers and total purchased qty.
                await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionTicketsUpdate, { upsert: false });
                ////////////////////////////////////////////////////////////////

                //Update order with new basket which contains the purchased ticket numbers. This is displayed on the /orderReceived GET route & /viewOrder route.
                await Order.findOneAndUpdate({ _id: savedOrder.id }, { basket: competitionEntries, orderStatus: 'Complete' }, { upsert: false });
            }

            req.flash('success', 'Your purchase was successful');
            console.log("Success Purchase Successful");
            req.session.basket = null;
            return res.redirect('/orderReceived');

        } catch (err) {
            console.log(err);
            req.flash('error', 'An error occurred during processing. Please try again.');
            return res.redirect('/checkout');
        }
    }
});


const checkBasketPendingOrder = async (req, res, next) => {
    try{
        var basket = new Basket(req.session.basket);
        var competitionEntries = basket.generateArray();
        var basketErrors = await basket.updateBasket(req.user);
        req.session.basket = basket;

        if(basketErrors.length > 0){
            basketErrors.unshift('Your basket changed before payment was made. You have not been charged. Please try again.');
            req.flash('error', basketErrors);
            return res.redirect('/basket');
        }

        // Get BillingAddress Reference from UserID
        const foundBAddress = await BillingAddress.findOne({ userReference: req.user });
        if (!foundBAddress) {
            console.log("No Address Saved");
            req.flash('error', 'Billing address error. Your billing address was not found. Order not saved.');
            return res.redirect('/checkout');
        }

        //Find users most recent Order that has a status of pending
        const savedOrder = await Order.findOne({ userReference: req.user, orderStatus: 'Pending'}).sort({ created: -1 });
        if (!savedOrder) {
            console.log("No Order Found");
            req.flash('error', 'No pending order found. Please complete all orders within 10 minutes. Please try again.');
            return res.redirect('/checkout');
        } else {
            //If found, check basket to make sure price and qty match, otherwise there is an error.
            if(competitionEntries.totalPrice != savedOrder.basket.totalPrice || competitionEntries.totalQty != savedOrder.basket.totalQty || competitionEntries.length != savedOrder.basket.length){
                req.flash('error', 'Order error. Your pending order record & basket do not match. Pending order has been cancelled. Please try again.');
                
                //If basket and found order basket do not match, cancel the order and remove 
                await Order.findOneAndUpdate({ _id: savedOrder._id }, { orderStatus: 'Cancelled' }, { upsert: false });

                for (let comp of competitionEntries) {
                    //Get competition from basket item
                    const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                    if (!foundCompetition) {
                        req.flash('error', 'This competition does not exist.');
                    }

                    ///////////////UPDATE COMPETITION RECORD - SUB TICKET QTY FROM pendingEntries count/////////////////
                    var competitionPendingUpdate = {
                        $inc: { 'pendingEntries': -comp.qty },
                        lastUpdated: new Date().toISOString(),
                    };
                    console.log('Cancelled - Competition qty to reduce = '+comp.qty);
                    await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
                }
                return res.redirect('/checkout');
            }
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred during processing. Please try again.');
        return res.redirect('/checkout');
    }
    
}
///////////////////////////////////////////////////////////////////

///////// Logged in users cannot access routes below //////////////

/* MUST NOT BE LOGGED IN TO ACCESS BELOW */
router.use('/', notLoggedIn, function(req, res, next) {
    next();
});


//////////////////////// Login / Register /////////////////////////
router.get(['/login', '/register', '/signup','/register/:referralCode?'], function(req, res, next) {
    var referralCode = req.params.referralCode || "";
    referralCode = referralCode.replace(/[^a-z0-9]/gi, "");
    referralCode = referralCode.substring(0, 12);
    
    var sMessages = req.flash('sError');
    var lMessages = req.flash('lError');
    var Errormessage = req.flash('error');

    if (Errormessage[0] == 'LOGIN Please populate required fields'){
        lMessages.push('Please populate required fields');
    } else if (Errormessage[0] == 'SIGNUP Please populate required fields'){
        sMessages.push('Please populate required fields');
    }

    res.render('login', { title: 'Login / Register', sMessages: sMessages, hasSErrors: sMessages.length > 0, lMessages: lMessages, hasLErrors: lMessages.length > 0, referralCode: referralCode, hasReferralCode: referralCode.length > 0});
});

/*
router.post('/login', passport.authenticate('local.login', {
    successRedirect: '/user',
    failureRedirect: '/login',
    badRequestMessage : 'LOGIN Please populate required fields',
    failureFlash: true
}));
*/

router.post('/login', async (req, res, next) => {
    // Store the current basket temporarily in the session
    const basketBeforeLogin = req.session.basket;

    try {
        const { user, info } = await new Promise((resolve, reject) => {
            passport.authenticate('local.login', (err, user, info) => {
                if (err) return reject(err);
                if (!user) return resolve({ user: null, info });
                resolve({ user, info });
            })(req, res, next);
        });

        if (!user) {
            return res.redirect('/login'); // Login failed
        }

        await new Promise((resolve, reject) => {
            req.logIn(user, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        if (basketBeforeLogin) {
            // Restore the basket from the temporary variable
            req.session.basket = basketBeforeLogin || {};
        } else {
            //Set basket and update basket if basket was present when last logged in
            if(user.basket){
                var basket = new Basket(user.basket);
                await basket.updateBasket(); // Update the basket
                req.session.basket = basket;
            }
        }
        if(req.session.oldUrl){
            var redirect = req.session.oldUrl;
            req.session.oldUrl = null;
            return res.redirect(redirect);
        } else {
            return res.redirect('/user'); // Login successful
        }
    } catch (err) {
        return next(err);
    }
});


/*
router.post('/register', passport.authenticate('local.signup', {
    successRedirect: '/user',
    failureRedirect: '/login',
    badRequestMessage : 'SIGNUP Please populate required fields',
    failureFlash: true
}));
*/

router.post('/register', (req, res, next) => {
    // Store the current basket temporarily in the session
    const basketBeforeLogin = req.session.basket;

    passport.authenticate('local.signup', {
        successRedirect: '/user',
        failureRedirect: '/login',
        badRequestMessage : 'SIGNUP Please populate required fields',
        failureFlash: true
    }, (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            return res.redirect('/login'); // Login failed
        }

        req.logIn(user, (err) => {
            if (err) { return next(err); }

            // Restore the basket from the temporary variable
            req.session.basket = basketBeforeLogin || {};

            if(req.session.oldUrl){
                var redirect = req.session.oldUrl;
                req.session.oldUrl = null;
                return res.redirect(redirect);
            } else {
                return res.redirect('/user'); // Login successful
            }
        });
    })(req, res, next);
});



///////////////////////////////////////////////////


module.exports = router;

//Check if logged in
function isLoggedIn(req, res, next){
    req.session.oldUrl = req.url;
    if(req.isAuthenticated()){
      return next();
    }
    //req.session.oldUrl = req.url;
    res.redirect('/login');
}

//Check if not logged in
function notLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
      return next();
    }
    res.redirect('/');
}

//Check if user is currently banned
function isNotBanned(req, res, next){
    if(!req.user.bannedUntilDate || (new Date(req.user.bannedUntilDate.getTime()) < Date.now())){
      return next();
    }
    res.redirect('/basket');
}

//Check if logged in
function saveRedirectURL(req, res, next){
    req.session.oldUrl = req.url;
    return next();
}

//Timer to check if order has been completed or if it needs to be cancelled (After 10 minutes)
function startPendingOrderTimer(orderID){
    console.log('Starting timer for orderID '+orderID);

    setTimeout(async function(){
        try{
            //console.log('Timer ended.... Check if order is still pending');
            //Update order with new basket which contains the purchased ticket numbers. This is displayed on the /orderReceived GET route & /viewOrder route.
            const foundOrder = await Order.findOneAndUpdate({ _id: orderID, orderStatus: 'Pending' }, { orderStatus: 'Cancelled' }, { upsert: false });

            if(foundOrder){
                //Go through each competition in basket.
                for (let comp of foundOrder.basket) {
                    //Get competition from basket item
                    const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                    if (!foundCompetition) {
                        req.flash('error', 'startPendingOrderTimer - This competition does not exist.');
                    }

                    ///////////////UPDATE COMPETITION RECORD - SUB TICKET QTY FROM pendingEntries count/////////////////
                    console.log('Competition qty to reduce = '+comp.qty);
                    var competitionPendingUpdate = {
                        $inc: { 'pendingEntries': -comp.qty },
                        lastUpdated: new Date().toISOString(),
                    };
                    await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
                }
                console.log('Competitions updated...');
            } else {
                console.log('Order Completed, nothing to update');
            }
        } catch (err) {
            console.log(err);
        }
    }, 600 * 1000);
}