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
    var errors = req.flash('error');

    Competition.findOne({_id: compID})
      .then(foundCompetition => {
            if(foundCompetition){
                res.render('admin/editCompetition', {title: 'Edit Competition', active: { dashboard: true }, competition: foundCompetition, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
            } else {
                console.log("Error finding competition");
                return res.render('admin/dashboard', { title: 'Dashboard', active: { dashboard: true }});
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
        req.checkBody('title', 'Title cannot be empty').notEmpty();
        req.checkBody('cashAlternative', 'Cash Alternative cannot be empty').notEmpty();
        req.checkBody('price', 'Price cannot be empty').notEmpty();
        req.checkBody('drawDate', 'Draw Date cannot be empty').notEmpty();
        req.checkBody('maxEntries', 'Max Entries cannot be empty').notEmpty();
        req.checkBody('maxEntriesPerPerson', 'MaxEntriesPerPerson cannot be empty').notEmpty();
        req.checkBody('maxPostalVotes', 'MaxPostalVotes cannot be empty').notEmpty();
        req.checkBody('questionText', 'Question Text cannot be empty').notEmpty();
        req.checkBody('questionAnswers', 'Question Answers cannot be empty').notEmpty();
        req.checkBody('correctAnswer', 'Correct Answer cannot be empty').notEmpty();

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/address');
        }
        
        var competitionUpdate = {
            //imagePath: {type: String, required: true},
            //additionalImagePaths: [{type: String, required: false}],
            title: req.body.title,
            description: req.body.description,
            cashAlternative: req.body.cashAlternative,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            drawDate: new Date(req.body.drawDate).toISOString(),
            maxEntries: req.body.maxEntries,
            maxEntriesPerPerson: req.body.maxEntriesPerPerson,
            maxPostalVotes: req.body.maxPostalVotes,
            questionText: req.body.questionText,
            questionAnswers: req.body.questionAnswers,
            correctAnswer: req.body.correctAnswer,
            //active: {type: Boolean, required: true, default: true},
            //visible: {type: Boolean, required: true, default: true},
            lastUpdated: new Date().toISOString(),
        };
        Competition.findOneAndUpdate({_id: req.body.compID}, competitionUpdate, {upsert: false})
        .then(() => {
            req.flash('success', 'Competition Successfully Updated');
            res.redirect('/admin/editCompetition/'+req.body.compID+'');
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        req.flash('error', 'Competition ID Missing');
        res.redirect('/admin/editCompetition/'+req.body.compID+'');
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