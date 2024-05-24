var express = require('express');
var router = express.Router();

var Competition = require('../models/competition');


/* MUST BE LOGGED ADMIN TO ACCESS BELOW */
router.use('/', isAdmin, function(req, res, next) {
    next();
});

/* GET admin listings. */
router.get('/', function(req, res, next) {
    var success = req.flash('success');
    Competition.find({})
      .then(foundCompetition => {
            res.render('admin/dashboard', {title: 'Dashboard', active: { dashboard: true }, competitions: foundCompetition, hasCompetitions: foundCompetition.length > 0, success: success, hasSuccess: success.length > 0});
    })
      .catch(err => {
            console.log(err);
    });
});

router.get('/editCompetition/:id', function(req, res, next) {
    var compID = req.params.id;

    var success = req.flash('success');

    Competition.findOne({_id: compID})
      .then(foundCompetition => {
            if(foundCompetition){
                res.render('admin/editCompetition', {title: 'Edit Competition', active: { dashboard: true }, competition: foundCompetition, success: success, hasSuccess: success.length > 0});
            } else {
                console.log("No Order Found or This is Not Your Order");
                return res.render('admin/dashboard', { title: 'View Order', active: { dashboard: true }, order: ""});
            }
    })
    .catch(err => {
        console.log(err);
    });
});


router.get('/winners', function(req, res, next) {
    res.render('admin/winners', { title: 'Winners', active: { winners: true } });
  });
  

  router.get('/discounts', function(req, res, next) {
    res.render('admin/discounts', { title: 'Discounts', active: { discounts: true } });
  });
  

  router.get('/users', function(req, res, next) {
    res.render('admin/users', { title: 'Users', active: { users: true } });
  });

  ///////////////////////////// POST ROUTES /////////////////////////////////////

  router.post('/updateCompetition', function(req, res, next) {

    //If no competition id is submitted with the form
    if(req.body.compID){
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
        req.flash('error', 'Competition ID Missing');
        res.redirect('/admin');
    }
});


  ///////////////////////////////Test Routes//////////////////////////////////////

  router.get('/addRewards', function(req, res, next) {

    var pointsToAdd = 10;
    //Update most recent order to include updated basket with ticket numbers.
    User.findOneAndUpdate({_id: req.user}, {$inc: { rewardPoints: pointsToAdd }}, {upsert: false})
    .then(() => {
        console.log('Updated Rewards');
        return res.redirect('/user/rewards');
    })
    .catch(err => {
        console.log(err);
    });
});


module.exports = router;

//Check is admin is superAdmin
function isAdmin(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.isAdmin === true){
            return next();
        }
    }
    res.redirect('/');
}