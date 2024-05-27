var express = require('express');
const fileUpload = require('express-fileupload');
//var multer  = require('multer');
//var upload = multer({ dest: 'uploads/' });
var router = express.Router();

var Competition = require('../models/competition');


/* MUST BE LOGGED IN AND ADMIN TO ACCESS BELOW */
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

router.get('/createCompetition', function(req, res, next) {
    var errors = req.flash('error');
    res.render('admin/createCompetition', { title: 'Create Competition', active: { dashboard: true }, error: errors, errors: errors.length > 0 });
});

router.get('/previewCompetition/:id', function(req, res, next) {
    var compID = req.params.id;
    var success = req.flash('success');
    var errors = req.flash('error');

    Competition.findOne({_id: compID})
      .then(foundCompetition => {
            if(foundCompetition){
                res.render('admin/previewCompetition', {title: 'Preview Competition', active: { dashboard: true }, competition: foundCompetition, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
            } else {
                console.log("Error finding competition");
                return res.render('admin/dashboard', { title: 'Dashboard', active: { dashboard: true }});
            }
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

//Get route to delete a competitions additional photo
router.get('/removeAdditionalImage/:compID', function(req, res, next) {
    var compID = req.params.compID;
    var imageID = req.query.imageID;

    var compUpdate = {
        $pull: { 'additionalImagePaths': imageID },
        lastUpdated: new Date().toISOString(),
    };
    Competition.findOneAndUpdate({_id: compID}, compUpdate, {upsert: false})
    .then(() => {
        req.flash('success', 'Image removed from competition');
        res.redirect('/admin/editCompetition/'+compID);
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Error removing image from competition');
        res.redirect('/admin/editCompetition/'+compID);
    });
});

//////////////////////////////// POST ROUTES /////////////////////////////////////

router.post('/updateCompetition', async (req, res, next) => {

    //If no competition id is submitted with the form
    if (!req.body.compID) {
        req.flash('error', 'Competition ID Missing');
        return res.redirect('/admin/editCompetition/' + req.body.compID);
    }

    //Set mainImageFile to current compImagePath
    var mainImageFile = req.body.compImagePath;
    const additionalImagePaths = [];
    console.log('Body- ' + JSON.stringify(req.body));

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
    req.checkBody('description', 'Description cannot be empty').notEmpty();

    var errors = req.validationErrors();
    if (errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        req.flash('error', messages);
        return res.redirect('/admin/editCompetition/'+req.body.compID+'');
    }

    //Check if correct answer is in the question answers
    if(!req.body.questionAnswers.includes(req.body.correctAnswer)){
        req.flash('error', 'The correct answer "'+req.body.correctAnswer+'" is not in the list of questions: '+req.body.questionAnswers);
        return res.redirect('/admin/editCompetition/'+req.body.compID+'');
    }
    //If discount price is submitted, make sure it is less than original price and higher than 0
    console.log(req.body.discountPrice);
    console.log(req.body.price);
    if(req.body.discountPrice && (req.body.discountPrice > req.body.price || req.body.discountPrice < 0)){
        req.flash('error', 'The discount price "'+req.body.discountPrice+'" must be less than the price "'+req.body.price+'". Discount price must also be more than 0.');
        return res.redirect('/admin/editCompetition/'+req.body.compID+'');
    }
    

    // If a new image has been uploaded
    if (req.files && req.files.mainImageUpload) {
        //console.log(req.files.mainImageUpload);

        mainImageFile = req.files.mainImageUpload;
        const uploadPath = __dirname + '/../imageUploads/' + mainImageFile.name;

        try {
            await moveFile(mainImageFile, uploadPath);
            mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
            console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name);
            console.log('New Main Image - '+mainImageFile);
        } catch (err) {
            console.log("error path: " + uploadPath);
            req.flash('error', 'Error uploading image - ' + uploadPath);
            return res.redirect('/admin/editCompetition/' + req.body.compID);
        }
    }
    //If additional images have been selected
    if(req.files && req.files.additionalImages){
        const additionalImages = req.files.additionalImages ? (Array.isArray(req.files.additionalImages) ? req.files.additionalImages : [req.files.additionalImages]) : [];
        // Upload additional images
        for (const image of additionalImages) {
            try {
                const uploadPath = __dirname + '/../imageUploads/' + image.name;
                await moveFile(image, uploadPath);
                //mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
                console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + image.name);
                additionalImagePaths.push(`${req.protocol}://${req.get('host')}/images/${image.name}`);
            } catch (err) {
                console.log("error path: " + uploadPath);
                req.flash('error', 'Error uploading image - ' + uploadPath);
                return res.redirect('/admin/editCompetition/' + req.body.compID);
            }
        }
    }

    // Set visible and active checkboxes
    const active = req.body.active === 'on';
    const visible = req.body.visible === 'on';

    //console.log('Active = ' + active);
    //console.log('Visible = ' + visible);

    //Convert questionAnswers to array of strings
    var questionAnswers = req.body.questionAnswers.split(',');
    
    //console.log('mainImageFile = ' +mainImageFile);
    //console.log('additionalImageFilePaths = '+additionalImagePaths);

    var competitionUpdate = {
        imagePath: mainImageFile,
        $push: { 
            additionalImagePaths: { $each: additionalImagePaths }
        },
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
        questionAnswers: questionAnswers,
        correctAnswer: req.body.correctAnswer,
        active: active,
        visible: visible,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await Competition.findOneAndUpdate({ _id: req.body.compID }, competitionUpdate, { upsert: false });
        req.flash('success', 'Competition Successfully Updated');
        res.redirect('/admin/editCompetition/' + req.body.compID);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error updating competition');
        res.redirect('/admin/editCompetition/' + req.body.compID);
    }
});

// Create a new competition
router.post('/createCompetition', async (req, res) => {
    try {

        //Set mainImageFile to current compImagePath
        var mainImageFile = req.body.compImagePath;
        const additionalImagePaths = [];

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
        req.checkBody('description', 'Description cannot be empty').notEmpty();

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/admin/createCompetition');
        }

        //Check if correct answer is in the question answers
        if(!req.body.questionAnswers.includes(req.body.correctAnswer)){
            req.flash('error', 'The correct answer "'+req.body.correctAnswer+'" is not in the list of questions: '+req.body.questionAnswers);
            return res.redirect('/admin/editCompetition/'+req.body.compID+'');
        }
        //If discount price is submitted, make sure it is less than original price and higher than 0
        console.log(req.body.discountPrice);
        console.log(req.body.price);
        if(req.body.discountPrice && (req.body.discountPrice > req.body.price || req.body.discountPrice < 0)){
            req.flash('error', 'The discount price "'+req.body.discountPrice+'" must be less than the price "'+req.body.price+'". Discount price must also be more than 0.');
            return res.redirect('/admin/editCompetition/'+req.body.compID+'');
        }

        // If a new image has been uploaded
        if (req.files && req.files.mainImageUpload) {
            //console.log(req.files.mainImageUpload);

            mainImageFile = req.files.mainImageUpload;
            const uploadPath = __dirname + '/../imageUploads/' + mainImageFile.name;

            try {
                await moveFile(mainImageFile, uploadPath);
                mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
                console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name);
                console.log('New Main Image - '+mainImageFile);
            } catch (err) {
                console.log("error path: " + uploadPath);
                req.flash('error', 'Error uploading image - ' + uploadPath);
                return res.redirect('/admin/editCompetition/' + req.body.compID);
            }
        }
        //If additional images have been selected
        if(req.files && req.files.additionalImages){
            const additionalImages = req.files.additionalImages ? (Array.isArray(req.files.additionalImages) ? req.files.additionalImages : [req.files.additionalImages]) : [];
            // Upload additional images
            for (const image of additionalImages) {
                try {
                    const uploadPath = __dirname + '/../imageUploads/' + image.name;
                    await moveFile(image, uploadPath);
                    //mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
                    console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + image.name);
                    additionalImagePaths.push(`${req.protocol}://${req.get('host')}/images/${image.name}`);
                } catch (err) {
                    console.log("error path: " + uploadPath);
                    req.flash('error', 'Error uploading image - ' + uploadPath);
                    return res.redirect('/admin/editCompetition/' + req.body.compID);
                }
            }
        }

        //Convert questionAnswers to array of strings
        var questionAnswers = req.body.questionAnswers.split(',');
        
        const newComp = new Competition({
            imagePath: mainImageFile,
            $push: { 
                additionalImagePaths: { $each: additionalImagePaths }
            },
            title: req.body.title,
            description: req.body.description,
            cashAlternative: req.body.cashAlternative,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            drawDate: new Date(req.body.drawDate),
            maxEntries: req.body.maxEntries,
            maxEntriesPerPerson: req.body.maxEntriesPerPerson,
            maxPostalVotes: req.body.maxPostalVotes,
            questionText: req.body.questionText,
            questionAnswers: questionAnswers,
            correctAnswer: req.body.correctAnswer,
        });

        const savedCompetition = await newComp.save();

        if (savedCompetition) {
            console.log('Competition Saved!');
            res.redirect(`/admin/previewCompetition/${savedCompetition._id}`);
        } else {
            console.log('Error saving competition');
            res.redirect('/admin/createCompetition');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error creating competition');
        res.redirect('/admin/createCompetition');
    }
});


//Update the competition visible or active from the preview competition page
router.post('/updatePreviewCompetition', function(req, res, next) {

    //If no competition id is submitted with the form
    if(req.body.compID){
        //Set visible and active checkboxes
        var active = false;
        var visible = false;
        if(req.body.active == 'on'){
            active = true;
        }
        if(req.body.visible == 'on'){
            visible = true;
        }
        
        var competitionUpdate = {
            active: active,
            visible: visible,
            lastUpdated: new Date().toISOString(),
        };
        Competition.findOneAndUpdate({_id: req.body.compID}, competitionUpdate, {upsert: false})
        .then(() => {
            req.flash('success', 'Competition Successfully Updated');
            res.redirect('/admin/previewCompetition/'+req.body.compID+'');
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        req.flash('error', 'Competition ID Missing');
        res.redirect('/admin/previewCompetition/'+req.body.compID+'');
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

// Utility function to move the file using a promise
function moveFile(file, uploadPath) {
    return new Promise((resolve, reject) => {
        file.mv(uploadPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}