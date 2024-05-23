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