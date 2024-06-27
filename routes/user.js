var express = require('express');
var router = express.Router();
var passport = require('passport');
var Order = require('../models/order');
var Basket = require('../models/basket');
var BillingAddress = require('../models/billingAddress');
var ShippingAddress = require('../models/shippingAddress');
var User = require('../models/user');
var Ticket = require('../models/ticket');
var Order = require('../models/order');
var UserChallenge = require('../models/userChallenge');
var CompletedChallenge = require('../models/completedChallenge');
var Coupon = require('../models/coupon');

/* MUST BE LOGGED IN TO ACCESS BELOW */
router.use('/', isLoggedIn, function(req, res, next) {
    next();
});


/* GET users listing. */
router.get('/', async (req, res, next) => {
    try {
        const foundTickets = await Ticket.find({ userReference: req.user });
        const foundOrders = await Order.find({ userReference: req.user }).sort({ created: -1 });

        if (foundTickets) {
            const compArr = foundTickets.map(comp => {
                comp.ticketNumbersObjects.sort((a, b) => {
                    return parseInt(a.ticketNumber) - parseInt(b.ticketNumber);
                });
                return comp;
            });

            return res.render('user/dashboard', {title: 'My Account', active: { dashboard: true }, competitions: compArr, hasCompetitions: foundTickets.length > 0, orders: foundOrders, hasOrders: foundOrders.length > 0});
        } else {
            console.log("No Competitions Found");
            return res.render('user/dashboard', {title: 'My Account', active: { dashboard: true }, competitions: "", hasCompetitions: foundTickets.length > 0, orders: foundOrders, hasOrders: foundOrders.length > 0});
        }
    } catch (err) {
        console.log(err);
        return res.render('user/dashboard', {title: 'My Account', active: { dashboard: true }, competitions: "", orders: ""});
    }
});

router.get('/viewOrder/:id', function(req, res, next) {
    var orderID = req.params.id;

    Order.findOne({_id: orderID, userReference: req.user})
    .then(foundOrder => {
        if (foundOrder) {
            var basket;
            basket = new Basket(foundOrder.basket);
            foundOrder.items = basket.generateArray();

            return res.render('user/viewOrder', { title: 'View Order', active: { dashboard: true }, order: foundOrder});
        } else {
            console.log("No Order Found or This is Not Your Order");
            return res.render('user/dashboard', { title: 'View Order', active: { dashboard: true }, order: ""});
        }
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/address', async function(req, res, next) {
    try {
        var errors = req.flash('error');
        var success = req.flash('success');
        var foundBAddress = await BillingAddress.findOne({ userReference: req.user });
        var foundSAddress = await ShippingAddress.findOne({ userReference: req.user });

        res.render('user/address', { 
            title: 'Addresses', 
            active: { address: true }, 
            userBillingAddress: foundBAddress || "",
            userShippingAddress: foundSAddress || "",  
            error: errors, 
            errors: errors.length > 0, 
            success: success, 
            successes: success.length > 0 
        });

    } catch (err) {
        console.log(err);
        res.redirect('/user');
    }
});

router.get('/accountDetails', function(req, res, next) {
    var errors = req.flash('error');
    var success = req.flash('success');

    User.findOne({_id: req.user})
    .then(foundUser => {
        if (foundUser) {
            res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true }, userDetails: foundUser, error: errors, errors: errors.length > 0, success: success, hasSuccess: success.length > 0});
        } else {
            console.log("Error getting user details");
            res.render('user/accountDetails', { title: 'Account Details', active: { accountDetails: true }, userDetails: "", error: errors, errors: errors.length > 0, success: success, hasSuccess: success.length > 0});
        }
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/rewards', async (req, res, next) => {
    var success = req.flash('success');
    var errors = req.flash('error');

    try {
        const userChallenges = await UserChallenge.find({active: true});

        const currentDate = new Date();
        const timeToWait = new Date(currentDate.getTime() - 15 * 60 * 1000); // 10 minutes in milliseconds
        req.session.checkedUserChallengeProgress = req.session.checkedUserChallengeProgress ? req.session.basket : new Date();
        if(new Date(req.session.checkedUserChallengeProgress).getTime() <= timeToWait){
            console.log('Update req.session.checkedUserChallengeProgress');
            req.session.checkedUserChallengeProgress = new Date();
            //Only update after timeToWait mins has passed to avoid excessive DB queries
            await updateUserChallengeProgress(req.user, userChallenges);
        }
        res.render('user/rewards', { title: 'Rewards', active: { rewards: true }, userChallenges: userChallenges, hasUserChallenges: userChallenges.length > 0, success: success, hasSuccess: success.length > 0, error: errors, hasError: errors.length > 0}); 
    } catch (err) {
        console.error(err);
    }
});

router.get('/safePlaying', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');

    res.render('user/safePlaying', { title: 'Safe Playing', active: { safePlaying: true }, success: success, hasSuccess: success.length > 0, error: errors, hasError: errors.length > 0 });
});


////////////////////// ROUTE POSTS //////////////////////////////

router.post('/address/:addressType', async function(req, res, next) {
    const addressType = req.params.addressType;

    try {
        if (addressType === "billing") {
            // Input Validation
            req.checkBody('firstName', 'First Name cannot be empty').notEmpty();
            req.checkBody('lastName', 'Last Name cannot be empty').notEmpty();
            req.checkBody('countryRegion', 'Country / Region cannot be empty').notEmpty();
            req.checkBody('streetAddress1', 'Street Address 1 cannot be empty').notEmpty();
            req.checkBody('townCity', 'Town / City cannot be empty').notEmpty();
            req.checkBody('postcode', 'Postcode cannot be empty').notEmpty();
            req.checkBody('phoneNumber', 'Phone Number cannot be empty').notEmpty();

            const errors = req.validationErrors();
            if (errors) {
                const messages = errors.map(error => error.msg);
                req.flash('error', messages);
                return res.redirect('/user/address');
            }

            const billingAddressUpdate = {
                userReference: req.user,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                streetAddress1: req.body.streetAddress1,
                streetAddress2: req.body.streetAddress2,
                townCity: req.body.townCity,
                county: req.body.county,
                postcode: req.body.postcode,
                phoneNumber: req.body.phoneNumber,
                lastUpdated: new Date().toISOString(),
            };

            await BillingAddress.findOneAndUpdate({ userReference: req.user }, billingAddressUpdate, { upsert: true });
            req.flash('success', 'Your billing details were saved');
            res.redirect('/user/address');
        } else if (addressType === "shipping") {
            // Input Validation
            req.checkBody('firstName', 'First Name cannot be empty').notEmpty();
            req.checkBody('lastName', 'Last Name cannot be empty').notEmpty();
            req.checkBody('streetAddress1', 'Street Address 1 cannot be empty').notEmpty();
            req.checkBody('townCity', 'Town / City cannot be empty').notEmpty();
            req.checkBody('postcode', 'Postcode cannot be empty').notEmpty();

            const errors = req.validationErrors();
            if (errors) {
                const messages = errors.map(error => error.msg);
                req.flash('error', messages);
                return res.redirect('/user/address');
            }

            const shippingAddressUpdate = {
                userReference: req.user,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                streetAddress1: req.body.streetAddress1,
                streetAddress2: req.body.streetAddress2,
                townCity: req.body.townCity,
                county: req.body.county,
                postcode: req.body.postcode,
                lastUpdated: new Date().toISOString(),
            };

            const shippingRef = await ShippingAddress.findOneAndUpdate({ userReference: req.user }, shippingAddressUpdate, { upsert: true });
            await User.findOneAndUpdate({ _id: req.user }, {shippingAddressReference: shippingRef.id}, { upsert: false });
            req.flash('success', 'Your shipping details were saved');
            res.redirect('/user/address');
        } else {
            req.flash('error', 'Unknown Address Type');
            res.redirect('/user/address');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred while updating your address');
        res.redirect('/user/address');
    }
});


router.post('/accountDetails/:form', function(req, res, next) {
    var form = req.params.form;

    if(form == "updateDetails"){
        //Input Validation
        req.checkBody('firstName', 'First Name cannot be empty').notEmpty();
        req.checkBody('lastName', 'Last Name cannot be empty').notEmpty();
        req.checkBody('displayName', 'Display Name cannot be empty').notEmpty();
        req.checkBody('emailAddress', 'Email Address cannot be empty').notEmpty();
        req.checkBody('DOBDD', 'Date of Birth Day cannot be empty').notEmpty();
        req.checkBody('DOBMM', 'Date of Birth Month cannot be empty').notEmpty();
        req.checkBody('DOBYY', 'Date of Birth Year cannot be empty').notEmpty();
        req.checkBody('DOBDD', 'Date of Birth Day cannot be empty').isInt();
        //req.checkBody('DOBMM', 'Date of Birth Month must be a String').isString();
        req.checkBody('DOBYY', 'Date of Birth Year cannot be empty').isInt();
        

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
    } else if (form == "commsPrefs") {
                
        // Set visible and active checkboxes
        const emailChecked = req.body.emailComms === 'on';
        const textChecked = req.body.textComms === 'on';
        const postChecked = req.body.postComms === 'on';

        var userCommsPrefs = {
            emailComms: emailChecked,
            textComms: textChecked,
            postComms: postChecked,
            lastUpdated: new Date().toISOString(),
        };
        User.findOneAndUpdate({_id: req.user}, userCommsPrefs, {upsert: false})
        .then(() => {
            req.flash('success', 'Your communication preferences were updated');
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

router.post('/updatePassword', passport.authenticate('local.updatePassword', {
    successRedirect: '/user/accountDetails',
    failureRedirect: '/user/accountDetails',
    badRequestMessage : 'Change Password: Please populate all required fields',
    failureFlash: true,
    successFlash: true,
    successFlash: 'Your password has been updated',
}));

router.post('/timeOut', async (req, res, next) => {
    //If no draw Result ID is submitted with the form
    if (!req.body.safePlayingRadio) {
        req.flash('error', 'Please Select an Option');
        return res.redirect('/user/safePlaying');
    }

    console.log('OptionSelected = ' + req.body.safePlayingRadio);

    var timeOutUntil = req.body.safePlayingRadio * 24 * 60 * 60 * 1000; /* ms */
    var timeOutUntilDate = new Date(Date.now() + timeOutUntil);

    var userBanUpdate = {
        bannedUntilDate: timeOutUntilDate,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await User.findOneAndUpdate({ _id: req.user }, userBanUpdate, { upsert: false });

        req.flash('success', 'Time Out Updated. You Cannot Play Until '+timeOutUntilDate);
        console.log('success');
        res.redirect('/user/safePlaying/');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Updating User Ban Date');
        console.log('error');
        res.redirect('/user/safePlaying/');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = router;

//Search username/email/userID to find a users account
async function updateUserChallengeProgress(userInfo, userChallengesDB) {
    try {

        //ADD CODE TO ONLY RUN THIS AFTER 10MINS HAS PASSED SINCE THE LAST TIME

        ////////////////////////////Get number of unique competitions the user has entered into///////////////////////////////////////////////
        var uniqueComps = await Ticket.aggregate([
            // Match tickets for the specific user
            { $match: { userReference: userInfo._id } },
            // Group by competitionReference and collect tickets in each group
            {
                $group: {
                    _id: "$competitionReference",
                    ticket: { $first: "$$ROOT" } // Take the first ticket in each group
                }
            },
            // Replace the root document with the ticket document
            { $replaceRoot: { newRoot: "$ticket" } }
        ]);

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////GET NUMBER OF REFERRED USERS THAT HAVE ENTERED COMPETITIONS/////////////////////////////////////
        let highestReferredUserCompEntries = 0; //Variable to track the referred user that has entered the highest number of unique competitions. For Refer a Friend 10
        let numberOfReferredUsersThatEnteredComps = 0; //Variable to count the total number of referred users that have entered at least 1 competition
        const referralCode = userInfo.referralCode;
        // Find users who signed up using this referral code
        const referredUsers = await User.find({ signupReferralCodeUsed: referralCode }, '_id');
        const referredUserIds = referredUsers.map(user => user._id);

        //console.log('referralCode= '+referralCode);
        //console.log('REFERED USERS= '+referredUserIds);

        if(referredUserIds.length > 0){
            //Get each referred user and the number of competitions they have entered.
            var referredUserCompEntriesCounts = await Ticket.aggregate([
                { $match: { userReference: { $in: referredUserIds } } },
                { $group: { _id: { userReference: "$userReference", competitionReference: "$competitionReference" } } },
                { $group: { _id: "$_id.userReference", uniqueCompetitionCount: { $sum: 1 } } }
            ]);
            
            //Check each referred user and the number of competitions they have entered and find the highest compEntries
            for (const entry of referredUserCompEntriesCounts) {
                if (entry.uniqueCompetitionCount > highestReferredUserCompEntries) {
                    highestReferredUserCompEntries = entry.uniqueCompetitionCount;
                }
                if(entry.uniqueCompetitionCount > 0){
                    numberOfReferredUsersThatEnteredComps++;
                }
            }
        } 
        //console.log('referredUserCompEntriesCounts= '+JSON.stringify(referredUserCompEntriesCounts));
        //console.log('LengthOfreferredUserCompEntriesCounts= '+referredUserCompEntriesCounts.length);
        //console.log('numberOfReferredUsersThatEnteredComps= '+numberOfReferredUsersThatEnteredComps);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////Go through each userChallenge, if user has reward already skip, if not check and update their progress.///////////////////////
        for (let challenge of userChallengesDB) {
            //If user has not completed challenge then check
            var userCompletedChallenges = userInfo.completedChallenges || [];
            if(!userCompletedChallenges.includes(challenge._id)){
                var markComplete = false;
                
                if(challenge.title == "10 Entries"){
                    //If entered 10 or more unique comps, add entry to completedChallengeSchema & update User.completedChallenges
                    if(uniqueComps.length >= 10){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: '10Entries',
                            couponDescription: '£5 Off',
                            couponAmount: 5,
                            minimumSpend: 0,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                    }
                } else if(challenge.title == "25 Entries"){
                    //If entered 25 or more unique comps, add entry to completedChallengeSchema & update User.completedChallenges
                    if(uniqueComps.length >= 25){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: '25Entries',
                            couponDescription: '£5 Off',
                            couponAmount: 5,
                            minimumSpend: 0,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                     }
                } else if(challenge.title == "50 Entries"){
                    //If entered 50 or more unique comps, add entry to completedChallengeSchema & update User.completedChallenges
                    if(uniqueComps.length >= 50){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: '50Entries',
                            couponDescription: '£10 Off',
                            couponAmount: 10,
                            minimumSpend: 0,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                     }
                } else if(challenge.title == "Happy Birthday!"){
                    //If users date of birth is today or since the users account was created then mark as completed
                    // Parse the DOB and creation date strings to Date objects
                    const dob = new Date(userInfo.DOB);
                    const created = new Date(userInfo.joinDate);

                    // Extract the month and day from the DOB
                    const dobMonth = dob.getMonth(); // getMonth() returns 0-11 for Jan-Dec
                    const dobDay = dob.getDate(); // getDate() returns 1-31 for the day of the month
                    const createdYear = created.getFullYear();
                    const birthdayThisYear = new Date(createdYear, dobMonth, dobDay);

                    // Calculate the date 3 months after the account creation date
                    const threeMonthsAfterCreation = new Date(created);
                    threeMonthsAfterCreation.setMonth(created.getMonth() + 3);

                    //If birthdays has passed this year since account was created (+3 months to prevent abuse)
                    var hasPassedSinceCreated = (threeMonthsAfterCreation < birthdayThisYear) && (new Date() > birthdayThisYear);
                    if(hasPassedSinceCreated){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: 'HappyBirthday',
                            couponDescription: '£5 Off £10 Basket',
                            couponAmount: 5,
                            minimumSpend: 10,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                    }
                } else if(challenge.title == "One lap around the sun!"){
                    //Your account is one year old! Reward for your One-Year Anniversary.
                    const created = new Date(userInfo.joinDate);
                    const currentDate = new Date();

                    const yearsDifference = currentDate.getFullYear() - created.getFullYear();
                    if (yearsDifference > 1 || yearsDifference === 1) {
                        if (currentDate.getMonth() > created.getMonth() || (currentDate.getMonth() === created.getMonth() && currentDate.getDate() >= created.getDate())) {
                            //Create Coupon
                            const newCoupon = {
                                userReference: userInfo._id,
                                sitewide: true,
                                couponCode: 'OneLap',
                                couponDescription: '£5 Off £10 Basket',
                                couponAmount: 5,
                                minimumSpend: 10,
                                couponExpiryDate: new Date("2099-01-01"),
                                numberOfUsesPerPerson: 1,
                                totalNumberOfUses: 1,
                                active: true,
                            };
                            const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                            if (savedCoupon) {
                                markComplete = true;
                            }
                        }
                    }
                } else if(challenge.title == "Refer a Friend"){
                    //Reward for referring a user that enters a paid competition
                    if(highestReferredUserCompEntries >= 1){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: 'ReferAFriend',
                            couponDescription: '£5 Off £10 Basket',
                            couponAmount: 5,
                            minimumSpend: 10,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                    }
                } else if(challenge.title == "Refer a Friend 10"){
                    //Reward for referring a user that enters 10 different paid competitions
                    if(highestReferredUserCompEntries >= 10){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: 'ReferAFriend10',
                            couponDescription: '£10 Off',
                            couponAmount: 10,
                            minimumSpend: 0,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                    }
                } else if(challenge.title == "5 Friends"){
                    //Reward for referring 5 different users that each enter a paid competition
                    if(numberOfReferredUsersThatEnteredComps >= 5){
                        //Create Coupon
                        const newCoupon = {
                            userReference: userInfo._id,
                            sitewide: true,
                            couponCode: 'Refer5Friends',
                            couponDescription: '£5 Off',
                            couponAmount: 5,
                            minimumSpend: 0,
                            couponExpiryDate: new Date("2099-01-01"),
                            numberOfUsesPerPerson: 1,
                            totalNumberOfUses: 1,
                            active: true,
                        };
                        const savedCoupon = await Coupon.findOneAndUpdate({ userReference: userInfo._id, couponCode: '10Entries'}, {newCoupon}, { upsert: true }); 
                        if (savedCoupon) {
                            markComplete = true;
                        }
                    }
                }

                //If user challenge has been completed, then update DB
                if(markComplete == true){
                    await CompletedChallenge.findOneAndUpdate({ userReference: userInfo._id, challengeReference: challenge._id}, {completed: true, lastUpdated: new Date().toISOString()}, { upsert: true }); 
                    await User.findOneAndUpdate({ _id: userInfo._id}, {$push: { completedChallenges: challenge._id }, lastUpdated: new Date().toISOString()}, { upsert: false });
                }
            }
        }

    } catch (err) {
        console.error(err);
    }
}

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
