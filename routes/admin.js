var express = require('express');
const fileUpload = require('express-fileupload');
//var multer  = require('multer');
//var upload = multer({ dest: 'uploads/' });
var router = express.Router();

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
mongoose.connect('mongodb://localhost:27017/CompetitionMain', {
    serverSelectionTimeoutMS: 5000
});

var Competition = require('../models/competition');
var User = require('../models/user');
var Winner = require('../models/winner');
var DrawResult = require('../models/drawResults');
var Ticket = require('../models/ticket');
var Order = require('../models/order');
var ShippingAddress = require('../models/shippingAddress');
var Coupon = require('../models/coupon');

// Define a schema for the sessions collection
//const sessionSchema = new mongoose.Schema({}, { collection: 'sessions' });
// Session schema (adjust if necessary)
const sessionSchema = new mongoose.Schema({
    _id: String,
    expires: Date,
    session: String
}, { collection: 'sessions' });

// Create a model for the sessions collection
const Session = mongoose.model('Session', sessionSchema);

/* MUST BE LOGGED IN AND ADMIN TO ACCESS BELOW */
router.use('/', isAdmin, function(req, res, next) {
    next();
});

/* GET admin listings. */
router.get('/', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');
    Competition.find({})
      .then(foundCompetition => {
            res.render('admin/dashboard', {title: 'Dashboard', active: { dashboard: true }, competitions: foundCompetition, hasCompetitions: foundCompetition.length > 0, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
    })
      .catch(err => {
            console.log(err);
    });
});

router.get('/competitionEntries/:id', async (req, res, next) => {
    const compID = req.params.id;
    const success = req.flash('success');
    const errors = req.flash('error');

    try {
        const competition = await Competition.findOne({ _id: compID});
        const correctTickets = await Ticket.find({ competitionReference: compID, compAnswer: competition.correctAnswer }).populate('userReference');
        const incorrectTickets = await Ticket.find({ competitionReference: compID, "compAnswer": { "$not": { $regex: new RegExp('^'+competition.correctAnswer+'$', 'i') } } }).populate('userReference');
        const correctUsers = await Ticket.countDocuments({ competitionReference: compID, compAnswer: competition.correctAnswer });
        const incorrectUsers = await Ticket.countDocuments({ competitionReference: compID, "compAnswer": { "$not": { $regex: new RegExp('^'+competition.correctAnswer+'$', 'i') } } });

        if (competition) {
            res.render('admin/competitionEntries', {
                title: 'View Competition Entries',
                active: { dashboard: true },
                competition: competition,
                correctTickets: correctTickets,
                incorrectTickets: incorrectTickets,
                correctUsers: correctUsers,
                incorrectUsers: incorrectUsers,
                success: success,
                hasSuccess: success.length > 0,
                error: errors,
                errors: errors.length > 0
            });
        } else {
            console.log("Error finding competition");
            req.flash('error', 'Error finding competition tickets');
            res.render('admin/dashboard', {
                title: 'Dashboard',
                active: { dashboard: true }
            });
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred while fetching tickets');
        res.render('admin/dashboard', {
            title: 'Dashboard',
            active: { dashboard: true }
        });
    }
});

router.get('/submitPostalEntry/:id', function(req, res, next) {
    var compID = req.params.id;
    var success = req.flash('success');
    var errors = req.flash('error');

    Competition.findOne({_id: compID})
      .then(foundCompetition => {
            if(foundCompetition){
                res.render('admin/submitPostalEntry', {title: 'Submit Competition Postal Entry', active: { dashboard: true }, competition: foundCompetition, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
            } else {
                console.log("Error finding competition");
                req.flash('error', 'finding competition');
                return res.redirect('/admin');
            }
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

// Draw Results ///////////////////////////////////
router.get('/drawResults', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');
    DrawResult.find({}).populate('competitionReference')
    .then(foundResults => {
        res.render('admin/drawResults', {title: 'Draw Results', active: { drawResults: true }, drawResults: foundResults, hasDrawResults: foundResults.length > 0, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/createDrawResult', function(req, res, next) {
    var errors = req.flash('error');
    res.render('admin/createDrawResultCard', { title: 'Create Draw Result', active: { drawResults: true }, error: errors, errors: errors.length > 0 });
});

router.get('/editDrawResult/:id', function(req, res, next) {
    var drawResultID = req.params.id;
    var success = req.flash('success');
    var errors = req.flash('error');

    DrawResult.findOne({_id: drawResultID}).populate('userReference').populate('competitionReference')
      .then(foundDrawResult => {
            if(foundDrawResult){
                res.render('admin/editDrawResultCard', {title: 'Edit Draw Result', active: { drawResults: true }, drawResult: foundDrawResult, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
            } else {
                console.log("Error finding draw result");
                return res.render('admin/drawResults', { title: 'Draw Results', active: { drawResults: true }});
            }
    })
    .catch(err => {
        console.log(err);
    });
});
//////////////////////////////////////////////
// Winners ///////////////////////////////////
router.get('/winners', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');
    Winner.find({})
    .then(foundWinners => {
        res.render('admin/winners', {title: 'Winners', active: { winners: true }, winners: foundWinners, hasWinners: foundWinners.length > 0, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/createWinner', function(req, res, next) {
    var errors = req.flash('error');
    res.render('admin/createWinnerCard', { title: 'Create Winner Card', active: { winners: true }, error: errors, errors: errors.length > 0 });
});

router.get('/editWinner/:id', function(req, res, next) {
    var winnerID = req.params.id;
    var success = req.flash('success');
    var errors = req.flash('error');

    Winner.findOne({_id: winnerID})
      .then(foundWinner => {
            if(foundWinner){
                res.render('admin/editWinnerCard', {title: 'Edit Winner', active: { winner: true }, winner: foundWinner, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0});
            } else {
                console.log("Error finding winner");
                return res.render('admin/winners', { title: 'Winners', active: { winner: true }});
            }
    })
    .catch(err => {
        console.log(err);
    });
});
//////////////////////////////////////////////

router.get('/coupons', async function(req, res, next) {
    try {
        var success = req.flash('success');
        var errors = req.flash('error');
        // Fetch all coupons in a single query
        const allCoupons = await Coupon.find({}).populate('userReference').populate('competitionReference');
        
        // Separate sitewide and other coupons in memory
        const sitewideCoupons = allCoupons.filter(coupon => coupon.sitewide);
        const otherCoupons = allCoupons.filter(coupon => !coupon.sitewide);

        res.render('admin/coupons', {
            title: 'Coupons',
            active: { coupons: true },
            sitewideCoupons: sitewideCoupons,
            hasSCoupons: sitewideCoupons.length > 0,
            otherCoupons: otherCoupons,
            hasOCoupons: otherCoupons.length > 0,
            success: success,
            hasSuccess: success.length > 0,
            error: errors,
            hasError: errors.length > 0
        });
    } catch (err) {
        console.log(err);
        next(err);  // Pass the error to the next middleware
    }
});

router.get('/createCoupon', function(req, res, next) {
    var errors = req.flash('error');
    res.render('admin/createCoupon', { title: 'Create Coupon', active: { coupons: true }, error: errors, hasError: errors.length > 0 });
});

router.get('/editCoupon/:id', function(req, res, next) {
    var couponID = req.params.id;
    var success = req.flash('success');
    var errors = req.flash('error');

    Coupon.findOne({_id: couponID})
      .then(foundCoupon => {
        if(foundCoupon){
            res.render('admin/editCoupon', {title: 'Edit Coupon', active: { coupons: true }, coupon: foundCoupon, success: success, hasSuccess: success.length > 0, error: errors, hasError: errors.length > 0});
        } else {
            console.log("Error finding winner");
            return res.redirect('admin/coupons');
        }
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/users', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');

    User.countDocuments({})
    .then(count => {
        User.find({}).limit(50).sort({created: -1})
        .then(foundUsers => {
            res.render('admin/users', { title: 'Users', active: { users: true }, users: foundUsers, success: success, hasSuccess: success.length > 0, error: errors, hasError: errors.length > 0, userCount: count}); 
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    });
});

router.get('/viewOrders', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');

    res.render('admin/viewOrders', { title: 'View Orders', active: { orders: true }, success: success, hasSuccess: success.length > 0, error: errors, hasError: errors.length > 0}); 
});

router.get('/admins', function(req, res, next) {
    var success = req.flash('success');
    var errors = req.flash('error');

    User.find({isAdmin: true})
      .then(foundAdmins => {
        res.render('admin/admins', { title: 'Admins', active: { admins: true }, admins: foundAdmins, success: success, hasSuccess: success.length > 0, error: errors, errors: errors.length > 0 }); 
    })
    .catch(err => {
        console.log(err);
    });
});

//////////Get route to remove an admin////////////////////////
router.get('/removeAdmin/:userID', function(req, res, next) {
    var userID = req.params.userID;

    var userUpdate = {
        isAdmin: false,
        lastUpdated: new Date().toISOString(),
    };
    User.findOneAndUpdate({_id: userID}, userUpdate, {upsert: false})
    .then(() => {
        req.flash('success', 'User has been removed as an admin');
        res.redirect('/admin/admins');
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Error removing admin');
        res.redirect('/admin/admins');
    });
});

router.get('/overwatch', async (req, res, next) => {
    var success = req.flash('success');
    var errors = req.flash('error');

    try {
        const result = await User.aggregate([
            {
                $match: {
                    signupReferralCodeUsed: { $nin: [null, ""] }
                }
            },
            {
                $group: {
                    _id: "$signupReferralCodeUsed",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'signupReferralCodeUsed',
                    as: 'users'
                }
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    users: {
                        _id: 1,
                        username: 1,
                        emailAddress: 1
                    }
                }
            }
        ]);

        const accountCredit = await User.find({}).sort({ accountCredit: -1 }).limit(10);

        res.render('admin/overwatch', { title: 'Overwatch', active: { overwatch: true }, referrals: result, accountCredit: accountCredit});

    } catch (err) {
        console.error(err);
    }
});

////////////Get route to delete a competitions additional photo//////////////////
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

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////// POST ROUTES /////////////////////////////////////

router.post('/addAdministrator', function(req, res, next) {
    var addAdminName = req.body.addAdminName;

    var userUpdate = {
        isAdmin: true,
        lastUpdated: new Date().toISOString(),
    };
    //Update most recent order to include updated basket with ticket numbers.
    User.findOneAndUpdate({ "username" : { $regex : new RegExp('^'+addAdminName+'$', "i") } }, userUpdate, {upsert: false})
    .then((foundAdmin) => {
        if(foundAdmin){
            console.log('Admin Added');
            req.flash('success', 'User added as Admin');
            return res.redirect('/admin/admins');
        } else {
            console.log('Add admin: User not found');
            req.flash('error', 'Username not found');
            return res.redirect('/admin/admins');
        }

    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Error'+error);
        return res.redirect('/admin/admins');
    });
});

//////////////////////////// Create/Edit Competition //////////////////////////////
router.post('/updateCompetition', async (req, res, next) => {

    //If no competition id is submitted with the form
    if (!req.body.compID) {
        req.flash('error', 'Competition ID Missing');
        return res.redirect('/admin');
    }

    //Set mainImageFile to current compImagePath
    var mainImageFile = req.body.compImagePath;
    const additionalImagePaths = [];
    //console.log('updateCompetition req.body = ' + JSON.stringify(req.body));

    //Input Validation
    req.checkBody('title', 'Title cannot be empty').notEmpty();
    req.checkBody('price', 'Price cannot be empty').notEmpty();
    req.checkBody('drawDate', 'Draw Date cannot be empty').notEmpty();
    req.checkBody('drawDate', 'Draw Date Format is not Valid').isDate();
    req.checkBody('entryCloseDate', 'Entry Close Date cannot be empty').notEmpty();
    req.checkBody('entryCloseDate', 'Entry Close Date Format is not Valid').isDate();
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
    if(req.body.discountPrice && (req.body.discountPrice > req.body.price || req.body.discountPrice < 0)){
        req.flash('error', 'The discount price "'+req.body.discountPrice+'" must be less than the price "'+req.body.price+'". Discount price must also be more than 0.');
        return res.redirect('/admin/editCompetition/'+req.body.compID+'');
    }
    //Check that competition entry closing date is at least 30 mins before draw date
    var THIRTY_MINS = 30 * 60 * 1000; /* ms */
    if(new Date(new Date(req.body.entryCloseDate).getTime() + THIRTY_MINS) > new Date(new Date(req.body.drawDate).getTime())){
        req.flash('error', 'The Entry Close Date '+new Date(req.body.entryCloseDate)+' must be at least 30 mins before draw date '+new Date(req.body.drawDate));
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
        entryCloseDate: new Date(req.body.entryCloseDate).toISOString(),
        maxEntries: req.body.maxEntries,
        maxEntriesPerPerson: req.body.maxEntriesPerPerson,
        maxPostalVotes: req.body.maxPostalVotes,
        questionText: req.body.questionText,
        questionAnswers: questionAnswers,
        correctAnswer: req.body.correctAnswer,
        winningTicketNumber: req.body.winningTicketNumber,
        active: active,
        visible: visible,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await Competition.findOneAndUpdate({ _id: req.body.compID }, competitionUpdate, { upsert: false });

        //!!!Backup functionality!!! - Delete everyones basket session if discount price is changed
        //if(req.body.discountPrice != req.body.oldDiscountPrice){
            //console.log('Deleting all session baskets...');
            //clearAllBaskets();
        //}

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
        req.checkBody('price', 'Price cannot be empty').notEmpty();
        req.checkBody('drawDate', 'Draw Date cannot be empty').notEmpty();
        req.checkBody('drawDate', 'Draw Date Format is not Valid').isDate();
        req.checkBody('entryCloseDate', 'Entry Close Date cannot be empty').notEmpty();
        req.checkBody('entryCloseDate', 'Entry Close Date Format is not Valid').isDate();
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
            return res.redirect('/admin/createCompetition/');
        }
        //If discount price is submitted, make sure it is less than original price and higher than 0
        console.log(req.body.discountPrice);
        console.log(req.body.price);
        if(req.body.discountPrice && (req.body.discountPrice > req.body.price || req.body.discountPrice < 0)){
            req.flash('error', 'The discount price "'+req.body.discountPrice+'" must be less than the price "'+req.body.price+'". Discount price must also be more than 0.');
            return res.redirect('/admin/createCompetition/');
        }
        //Check that competition entry closing date is at least 30 mins before draw date
        var THIRTY_MINS = 30 * 60 * 1000; /* ms */
        if(new Date(new Date(req.body.entryCloseDate).getTime() + THIRTY_MINS) > new Date(new Date(req.body.drawDate).getTime())){
            req.flash('error', 'The Entry Close Date '+new Date(req.body.entryCloseDate)+' must be at least 30 mins before draw date '+new Date(req.body.drawDate));
            return res.redirect('/admin/createCompetition/');
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
                return res.redirect('/admin/createCompetition/');
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
                    return res.redirect('/admin/createCompetition/');
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
            entryCloseDate: new Date(req.body.entryCloseDate),
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

//Submit a postal entry for a user.
router.post('/submitPostalEntry', async (req, res, next) => {
    try {

        if (!req.body.compID) {
            req.flash('error', 'Competition ID Missing');
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }

        //Check to make sure required fields are set.
        req.checkBody('userInfo', 'Username or Email Address cannot be empty').notEmpty();
        req.checkBody('postalAnswer', 'Answer to competition question cannot be empty').notEmpty();

        // Validate required fields
        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }

        // Find the competition
        const competition = await Competition.findById(req.body.compID);
        if (!competition) {
            req.flash('error', 'Competition ID not found');
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }

        // Check if competition is sold out
        if (competition.currentEntries >= competition.maxEntries) {
            req.flash('error', 'Competition is sold out');
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }
        // Check if competition + pendingEntries is sold out
        if ((competition.currentEntries + competition.pendingEntries) >= competition.maxEntries) {
            req.flash('error', 'The last remaining tickets are in the process of being purchased. Check back later to see if they are cancelled.');
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }

        //Get User Information
        const postalUser = await User.findOne({ "username" : { $regex : new RegExp('^'+req.body.userInfo+'$', "i") } });
        if (!postalUser) {
            const postalUser = await User.findOne({ "emailAddress" : { $regex : new RegExp('^'+req.body.userInfo+'$', "i") } });
            if (!postalUser) {
                req.flash('error', 'Username / Email Address not found');
                return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
            }
        }

        // Check if user has not exceeded max postal entries per person      
        var postalVotesSubmitted = await findPostalEntry(postalUser._id, req.body.compID);

        if (postalVotesSubmitted >= competition.maxPostalVotes) {
            req.flash('error', 'User has reached maximum postal entries for this competition. Postal Entries = '+postalVotesSubmitted);
            return res.redirect('/admin/submitPostalEntry/'+req.body.compID);
        }

        //Generate Tickets
        var soldCompTicketNumbers = competition.ticketNumbersSold;
        var ticketOrderObjArray = [];
        var newTicketNumbers = [];


        let foundRandomNumber = false;
        while (!foundRandomNumber) {
            var randomTicketNumber = Math.floor(Math.random() * competition.maxEntries) + 1;
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


        // Create a new order for the user and mark as a postal vote
        const newOrder = new Order({
            userReference: req.user._id,
            basket: [
                {
                    item: competition,
                    uniqueID: Date.now(),
                    qty: 1,
                    itemTotalPrice: 0,
                    questionAnswer: req.body.postalAnswer,
                    ticketNumbers: newTicketNumbers
                }
                ],
            paymentID: 'PostalEntry',
            paymentMethod: 'PostalEntry',
            paymentPrice: 0,
            paymentSubtotalPrice: 0,
            orderStatus: 'Completed',
        });
        var savedOrder = await newOrder.save();


        var ticketObj = {};
        ticketObj["orderID"] = savedOrder.id;
        ticketObj["ticketNumber"] = randomTicketNumber;
        ticketOrderObjArray.push(ticketObj);
        

        //Sort newTicketNumbers lowest to highest
        newTicketNumbers = newTicketNumbers.sort((a, b) => a - b);
        //Update comp.ticketNumbers to update the basket for orderReceived Page
        //comp.ticketNumbers = newTicketNumbers;

        var ticketUpdate = {
            userReference: req.user._id,
            competitionReference: req.body.compID,
            competitionTitle: competition.title,
            competitionDrawDate: competition.drawDate,
            $inc: { ticketQty: 1 },
            compAnswer: req.body.postalAnswer,
            $push: { 
                ticketNumbers: { $each: newTicketNumbers },
                ticketNumbersObjects: { $each: ticketOrderObjArray }
            },
            //mostRecentlyPurchasedTicketNumbers: newTicketNumbers,
            lastUpdated: new Date().toISOString(),
        };
        await Ticket.findOneAndUpdate(
            { userReference: req.user._id, compAnswer: req.body.postalAnswer },
            ticketUpdate,
            { upsert: true }
        );

        ///////////////UPDATE COMPETITION RECORD FOR MOST RECENT PURCHASED TICKETS/////////////////
        //Sort all sold tickets for the competition to update in the database
        soldCompTicketNumbers = soldCompTicketNumbers.sort((a, b) => a - b);
        var competitionTicketsUpdate = {
            ticketNumbersSold: soldCompTicketNumbers,
            $inc: {
                'currentEntries': 1,
            },
            lastUpdated: new Date().toISOString(),
        };
        //Update competition to include purchased ticket numbers and total purchased qty.
        await Competition.findOneAndUpdate({ _id: req.body.compID }, competitionTicketsUpdate, { upsert: false });
        ////////////////////////////////////////////////////////////////

        //Update order with new basket which contains the purchased ticket numbers. This is displayed on the /orderReceived GET route & /viewOrder route.
        //await Order.findOneAndUpdate({ _id: savedOrder.id }, { basket: competitionEntries, orderStatus: 'Complete' }, { upsert: false });


        req.flash('success', 'Postal entry submitted successfully');
        res.redirect('/admin/submitPostalEntry/'+req.body.compID);
    } catch (error) {
        console.log('Error submitting postal entry:', error);
        req.flash('error', 'An error occurred while submitting the postal entry');
        res.redirect('/admin/submitPostalEntry/'+req.body.compID);
    }
});


//////////////////////////////////////////////////////////////////////
////////////////////// Create a new winner card //////////////////////
router.post('/createWinner', async (req, res) => {
    try {
        //Set mainImageFile to current compImagePath
        var mainImageFile = req.body.winnerImagePath;

        //Input Validation
        req.checkBody('title', 'Title cannot be empty').notEmpty();
        req.checkBody('description', 'Description cannot be empty').notEmpty();
        req.checkBody('compID', 'Competition ID cannot be empty').notEmpty();
 
        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/admin/createWinner');
        }

        // If a new image has been uploaded
        if (req.files && req.files.mainImageUpload) {
            mainImageFile = req.files.mainImageUpload;
            const uploadPath = __dirname + '/../imageUploads/' + mainImageFile.name;

            try {
                await moveFile(mainImageFile, uploadPath);
                mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
                //console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name);
                //console.log('New Main Image - '+mainImageFile);
            } catch (err) {
                //console.log("error path: " + uploadPath);
                req.flash('error', 'Error uploading image - ' + uploadPath);
                return res.redirect('/admin/createWinner/');
            }
        }

        const visible = req.body.visible === 'on';
        const pinned = req.body.pinned === 'on';
        
        const newWinner = new Winner({
            imagePath: mainImageFile,
            title: req.body.title,
            description: req.body.description,
            visible: visible,
            pinned: pinned,
            competitionReference: req.body.compID,
        });

        const savedWinner = await newWinner.save();

        if (savedWinner) {
            console.log('Winner Card Saved!');
            res.redirect('/admin/winners');
        } else {
            console.log('Error Saving Winner Card');
            res.redirect('/admin/createWinner');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Creating Winner Card');
        res.redirect('/admin/createWinner');
    }
});

//Edit winner card
router.post('/updateWinner', async (req, res, next) => {

    //If no competition id is submitted with the form
    if (!req.body.winnerID) {
        req.flash('error', 'Winner ID Missing');
        return res.redirect('/admin/winners');
    }

    //Set mainImageFile to current compImagePath
    var mainImageFile = req.body.winnerImagePath;
    //console.log('updateWinner req.body = ' + JSON.stringify(req.body));

    //Input Validation
    req.checkBody('title', 'Title cannot be empty').notEmpty();
    req.checkBody('description', 'Description cannot be empty').notEmpty();
    req.checkBody('compID', 'Competition ID cannot be empty').notEmpty();

    var errors = req.validationErrors();
    if (errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        req.flash('error', messages);
        return res.redirect('/admin/editWinner/'+req.body.winnerID);
    }

    console.log(req.files);
    // If a new image has been uploaded
    if (req.files && req.files.mainImageUpload) {
        console.log('TRUE');
        console.log(req.files.mainImageUpload);

        mainImageFile = req.files.mainImageUpload;
        const uploadPath = __dirname + '/../imageUploads/' + mainImageFile.name;

        try {
            await moveFile(mainImageFile, uploadPath);
            mainImageFile = req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name;
            console.log('Test URL: ' + req.protocol + '://' + req.get('host') + '/images/' + mainImageFile.name);
            console.log('New Main Image - '+mainImageFile);
        } catch (err) {
            //console.log("error path: " + uploadPath);
            req.flash('error', 'Error uploading image - ' + uploadPath);
            return res.redirect('/admin/editWinner/' + req.body.winnerID);
        }
    } else if (!mainImageFile) {
        req.flash('error', 'Winner image is required');
        return res.redirect('/admin/editWinner/' + req.body.winnerID);
    }

    // Set visible and active checkboxes
    const visible = req.body.visible === 'on';
    const pinned = req.body.pinned === 'on';

    var winnerUpdate = {
        imagePath: mainImageFile,
        title: req.body.title,
        description: req.body.description,
        competitionReference: req.body.compID,
        visible: visible,
        pinned: pinned,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await Winner.findOneAndUpdate({ _id: req.body.winnerID }, winnerUpdate, { upsert: false });

        req.flash('success', 'Winner Card Successfully Updated');
        res.redirect('/admin/editWinner/' + req.body.winnerID);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error updating Winner Card');
        res.redirect('/admin/editWinner/' + req.body.winnerID);
    }
});

/////////////////////////////////////////////////////////////////////////
//////////////////// Create a new draw result card /////////////////////
router.post('/createDrawResult', async (req, res) => {
    try {

        //Input Validation
        req.checkBody('compID', 'Competition ID cannot be empty').notEmpty();
        req.checkBody('username', 'Winner username cannot be empty').notEmpty();
        req.checkBody('title', 'Title cannot be empty').notEmpty();
        req.checkBody('description', 'Description cannot be empty').notEmpty();
 
        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/admin/createDrawResult');
        }

        //Lookup username and find userID
        var returnedUser = await User.findOne({ "username" : { $regex : new RegExp('^'+req.body.username+'$', "i") } });

        if(returnedUser){
            var userReference = returnedUser._id;
        } else {
            req.flash('error', 'Username not found');
            return res.redirect('/admin/createDrawResult');
        }

        //Check if compID is valid
        // Find the competition
        const competition = await Competition.findById(req.body.compID);
        if (!competition) {
            req.flash('error', 'Competition ID not found');
            return res.redirect('/admin/createDrawResult');
        }

        const visible = req.body.visible === 'on';
        
        const newDrawResult = new DrawResult({
            competitionReference: req.body.compID,
            userReference: userReference,
            title: req.body.title,
            description: req.body.description,
            winningTicketNumber: req.body.winningTicketNumber,
            visible: visible,
        });

        const savedDrawResult = await newDrawResult.save();

        if (savedDrawResult) {
            console.log('Draw Result Card Saved!');
            res.redirect('/admin/drawResults');
        } else {
            console.log('Error Saving Draw Result Card');
            res.redirect('/admin/createDrawResult');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Creating Draw Result Card');
        res.redirect('/admin/createDrawResult');
    }
});

//Edit draw result card/////////////////////////////////////////////
router.post('/updateDrawResult', async (req, res, next) => {

    //If no draw Result ID is submitted with the form
    if (!req.body.drawResultID) {
        req.flash('error', 'Draw Result ID Missing');
        return res.redirect('/admin/drawResults');
    }

    //Input Validation
    req.checkBody('compID', 'Competition ID cannot be empty').notEmpty();
    req.checkBody('username', 'Winner username cannot be empty').notEmpty();
    req.checkBody('title', 'Title cannot be empty').notEmpty();
    req.checkBody('description', 'Description cannot be empty').notEmpty();

    var errors = req.validationErrors();
    if (errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        req.flash('error', messages);
        return res.redirect('/admin/createDrawResult');
    }

    //Lookup username and find userID
    var returnedUser = await User.findOne({ "username" : { $regex : new RegExp('^'+req.body.username+'$', "i") } });
        
    if(returnedUser){
        var userReference = returnedUser._id;
    } else {
        req.flash('error', 'Username not found');
        return res.redirect('/admin/editDrawResult'+ req.body.drawResultID);
    }

    // Set visible and active checkboxes
    const visible = req.body.visible === 'on';

    var drawResultUpdate = {
        competitionReference: req.body.compID,
        userReference: userReference,
        title: req.body.title,
        description: req.body.description,
        winningTicketNumber: req.body.winningTicketNumber,
        visible: visible,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await DrawResult.findOneAndUpdate({ _id: req.body.drawResultID }, drawResultUpdate, { upsert: false });

        req.flash('success', 'Draw Result Card Successfully Updated');
        res.redirect('/admin/editDrawResult/' + req.body.drawResultID);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error updating Draw Result Card');
        res.redirect('/admin/editDrawResult/' + req.body.drawResultID);
    }
});
//////////////////////////////////////////////////////////////////////////////////////
///////////////////////////Create a New Coupon////////////////////////////////////////
router.post('/createCoupon', async (req, res) => {
    try {

        var couponCode = req.body.couponCode.replace(/[^a-z0-9-_]/gi, "");
        couponCode = couponCode.toLowerCase();

        var couponDescription = req.body.couponDescription.replace(/[^a-z0-9£% _-]/gi, "");
        //Input Validation
        req.checkBody('couponCode', 'Coupon Code cannot be empty').notEmpty();
        req.checkBody('couponCode', 'Coupon Code Must be between 3 and 20 characters').isLength({min:3, max:30});
        req.checkBody('couponDescription', 'Coupon Description cannot be empty').notEmpty();
        req.checkBody('couponDescription', 'Coupon Description Must be between 3 and 100 characters').isLength({min:3, max:100});
        req.checkBody('couponExpiryDate', 'Coupon expiry date cannot be empty').notEmpty();
        req.checkBody('couponExpiryDate', 'Coupon expiry date format is invalid').isDate();
        req.checkBody('couponMinimumSpend', 'Minimum Spend cannot be empty').notEmpty();
        req.checkBody('couponMinimumSpend', 'Minimum Spend must be a number').isInt();
        req.checkBody('numberOfUsesPerPerson', 'Number of uses per person cannot be empty').notEmpty();
        req.checkBody('numberOfUsesPerPerson', 'Number of uses must be a number').isInt();
        req.checkBody('totalNumberOfUses', 'Total Number of uses cannot be empty').notEmpty();
        req.checkBody('totalNumberOfUses', 'Total Number of uses must be a number').isInt();
 
        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('/admin/createCoupon');
        }

        //Lookup userinfo and get userID 
        var foundUserID; 
        if(req.body.userInfo){
            foundUserID = await findUserID(req.body.userInfo);
            if(!foundUserID){
                req.flash('error', 'User was not found');
                return res.redirect('/admin/createCoupon');
            }
        }

        //Find Competition ID  
        var foundCompID; 
        if(req.body.compID){
            foundCompID = await Competition.findById(req.body.compID);
            if (!foundCompID) {
                req.flash('error', 'Competition ID not found');
                return res.redirect('/admin/createCoupon');
            }
        }

        //couponType Check
        if(req.body.couponAmount && req.body.couponPercent){
            req.flash('error', 'Coupon Amount and Coupon Percent cannot both have a value. Select One.');
            return res.redirect('/admin/createCoupon');
        } else if(!req.body.couponAmount && !req.body.couponPercent){
            req.flash('error', 'Coupon Amount or Coupon Percent must have a value.');
            return res.redirect('/admin/createCoupon');
        }

        const sitewide = req.body.sitewide === 'on';
        const active = req.body.active === 'on';

        if(req.body.compID && sitewide){
            req.flash('error', 'Coupon cannot apply sitewide & to a specific Competition ID');
            return res.redirect('/admin/createCoupon');
        }
        
        const newCoupon = new Coupon({
            userReference: foundUserID,
            competitionReference: foundCompID,
            sitewide: sitewide,
            couponCode: couponCode,
            couponDescription: couponDescription,
            couponAmount: req.body.couponAmount,
            couponPercent: req.body.couponPercent,
            minimumSpend: req.body.couponMinimumSpend,
            couponExpiryDate: req.body.couponExpiryDate,
            numberOfUsesPerPerson: req.body.numberOfUsesPerPerson,
            totalNumberOfUses: req.body.totalNumberOfUses,
            active: active,
        });
        const savedCoupon = await newCoupon.save();

        if (savedCoupon) {
            //console.log('Coupon Saved!');
            req.flash('success', 'Coupon Created');
            res.redirect('/admin/coupons');
        } else {
            console.log('Error Saving Coupon');
            req.flash('error', 'Error Creating New Coupon');
            res.redirect('/admin/createCoupon');
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Creating New Coupon');
        res.redirect('/admin/createCoupon');
    }
});

router.post('/updateCoupon', async (req, res, next) => {

    //If no competition id is submitted with the form
    if (!req.body.couponID) {
        req.flash('error', 'Coupon ID Missing');
        return res.redirect('/admin/coupons');
    }

    var couponCode = req.body.couponCode.replace(/[^a-z0-9-_]/gi, "");
    couponCode = couponCode.toLowerCase();

    var couponDescription = req.body.couponDescription.replace(/[^a-z0-9£% _-]/gi, "");
    //Input Validation
    req.checkBody('couponCode', 'Coupon Code cannot be empty').notEmpty();
    req.checkBody('couponCode', 'Coupon Code Must be between 3 and 20 characters').isLength({min:3, max:30});
    req.checkBody('couponDescription', 'Coupon Description cannot be empty').notEmpty();
    req.checkBody('couponDescription', 'Coupon Description Must be between 3 and 100 characters').isLength({min:3, max:100});
    req.checkBody('couponExpiryDate', 'Coupon expiry date cannot be empty').notEmpty();
    req.checkBody('couponExpiryDate', 'Coupon expiry date format is invalid').isDate();
    req.checkBody('couponMinimumSpend', 'Minimum Spend cannot be empty').notEmpty();
    req.checkBody('couponMinimumSpend', 'Minimum Spend must be a number').isInt();
    req.checkBody('numberOfUsesPerPerson', 'Number of uses per person cannot be empty').notEmpty();
    req.checkBody('numberOfUsesPerPerson', 'Number of uses must be a number').isInt();
    req.checkBody('totalNumberOfUses', 'Total Number of uses cannot be empty').notEmpty();
    req.checkBody('totalNumberOfUses', 'Total Number of uses must be a number').isInt();

    var errors = req.validationErrors();
    if (errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        req.flash('error', messages);
        return res.redirect('/admin/editCoupon/' + req.body.couponID);
    }

    //Lookup userinfo and get userID 
    var foundUserID; 
    if(req.body.userInfo){
        foundUserID = await findUserID(req.body.userInfo);
        if(!foundUserID){
            req.flash('error', 'User was not found');
            return res.redirect('/admin/editCoupon/' + req.body.couponID);
        }
    }

    //Find Competition ID  
    var foundCompID; 
    console.log('CompID '+req.body.compID);
    if(req.body.compID && ObjectId.isValid(req.body.compID)){
        foundCompID = await Competition.findById(req.body.compID);
        if (!foundCompID) {
            req.flash('error', 'Competition ID not found');
            return res.redirect('/admin/editCoupon/' + req.body.couponID);
        }
    }
    console.log('foundCompID'+foundCompID);

    //couponType Check
    if(req.body.couponAmount && req.body.couponPercent){
        req.flash('error', 'Coupon Amount and Coupon Percent cannot both have a value. Select One.');
        return res.redirect('/admin/editCoupon/' + req.body.couponID);
    } else if(!req.body.couponAmount && !req.body.couponPercent){
        req.flash('error', 'Coupon Amount or Coupon Percent must have a value.');
        return res.redirect('/admin/editCoupon/' + req.body.couponID);
    }

    const sitewide = req.body.sitewide === 'on';
    const active = req.body.active === 'on';

    if(req.body.compID && sitewide){
        req.flash('error', 'Coupon cannot apply sitewide & to a specific Competition ID');
        return res.redirect('/admin/editCoupon/' + req.body.couponID);
    }

    var couponUpdate = {
        userReference: foundUserID,
        competitionReference: foundCompID,
        sitewide: sitewide,
        couponCode: couponCode,
        couponDescription: couponDescription,
        couponAmount: req.body.couponAmount,
        couponPercent: req.body.couponPercent,
        minimumSpend: req.body.couponMinimumSpend,
        couponExpiryDate: req.body.couponExpiryDate,
        numberOfUsesPerPerson: req.body.numberOfUsesPerPerson,
        totalNumberOfUses: req.body.totalNumberOfUses,
        active: active,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await Coupon.findOneAndUpdate({ _id: req.body.couponID }, couponUpdate, { upsert: false });

        req.flash('success', 'Coupon Successfully Updated');
        res.redirect('/admin/editCoupon/' + req.body.couponID);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error updating Coupon');
        res.redirect('/admin/editCoupon/' + req.body.couponID);
    }
});

////////////Find Coupon Details from submitted form////////////
router.post('/coupons', async (req, res, next) => {
    var couponInfo = req.body.couponInfo;
    //If no draw Result ID is submitted with the form
    if (!couponInfo) {
        req.flash('error', 'Coupon Information is Missing');
        return res.redirect('/admin/coupons');
    }

    try {
        var foundCoupon;
        if(ObjectId.isValid(couponInfo)){
            foundCoupon = await Coupon.findById({_id: couponInfo});
        } else {
            foundCoupon = await Coupon.findOne({ couponCode: couponInfo });
        }

        if(!foundCoupon){
            req.flash('error', 'Coupon was not found');
            return res.redirect('/admin/coupons');
        } else {
            res.render('admin/coupons', { title: 'Coupons', active: { coupons: true }, foundCouponInfo: foundCoupon});
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Finding Coupon');
        res.redirect('/admin/coupons');
    }
});
////////////Competition Entries - Update Competition Winning Ticket Number////////////
router.post('/competitionEntries', async (req, res, next) => {

    //If no draw Result ID is submitted with the form
    if (!req.body.compID) {
        req.flash('error', 'Competition ID Missing from competitionEntries form');
        return res.redirect('/admin');
    }

    try {
        await Competition.findOneAndUpdate({ _id: req.body.compID }, {winningTicketNumber: req.body.winningTicketNumber, lastUpdated: new Date().toISOString() }, { upsert: false });

        req.flash('success', 'Winning Ticket Number Successfully Updated');
        res.redirect('/admin/competitionEntries/'+req.body.compID);
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error updating Winning Ticket Number');
        res.redirect('/admin/competitionEntries/'+req.body.compID);
    }
});

////////////Find User Details from submitted form////////////
router.post('/users', async (req, res, next) => {

    var userLookupInfo = req.body.userLookupInfo;
    //If no draw Result ID is submitted with the form
    if (!userLookupInfo) {
        req.flash('error', 'User Information input is missing');
        return res.redirect('/admin/users');
    }

    try {
        var foundUser = await User.find({ "username" : { $regex : new RegExp('^'+userLookupInfo+'$', "i") } }).populate('shippingAddressReference');
        if(foundUser.length == 0){
            foundUser = await User.find({ "emailAddress" : { $regex : new RegExp('^'+userLookupInfo+'$', "i") } });
        }
        if(foundUser.length == 0){
            foundUser = await User.find({ "displayName" : { $regex : new RegExp('^'+userLookupInfo+'$', "i") } });
        }
        if(foundUser.length == 0){
            foundUser = await User.find({ "firstName" : { $regex : new RegExp('^'+userLookupInfo+'$', "i") } });
        }
        if(foundUser.length == 0){
            foundUser = await User.find({ "lastName" : { $regex : new RegExp('^'+userLookupInfo+'$', "i") } });
        }

        if(foundUser.length > 0){
            //Get shipping address of foundUsers
            for (let user of foundUser) {
                //Get competition from basket item
                const foundSAddress = await ShippingAddress.findOne({ userReference: user._id });
                
            }

            res.render('admin/users', { title: 'Users', active: { users: true }, userInfo: foundUser});
        } else {
            res.render('admin/users', { title: 'Users', active: { users: true }, errors: true, error: ["User Details Not Found"]});
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Finding Users');
        res.redirect('/admin/users/');
    }
});

router.post('/updateUserBan', async (req, res, next) => {

    //If no draw Result ID is submitted with the form
    if (!req.body.userID) {
        req.flash('error', 'User ID Missing');
        return res.redirect('/admin/users');
    }

    var userBannedUntil = req.body.userBannedUntil;
    if(userBannedUntil){
        req.checkBody('userBannedUntil', 'Date Format is not Valid').isDate();

        var errors = req.validationErrors();
        if (errors){
            var messages = [];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            req.flash('error', messages);
            console.log(messages);
            return res.redirect('/admin/users');
        }
        userBannedUntil = new Date(userBannedUntil).toISOString()
    }
    

    //Lookup username and find userID
    var returnedUser = await User.findById(req.body.userID);
        
    if(!returnedUser){
        req.flash('error', 'UserID not found');
        return res.redirect('/admin/users');
    }

    var userBanUpdate = {
        bannedUntilDate: userBannedUntil,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await User.findOneAndUpdate({ _id: req.body.userID }, userBanUpdate, { upsert: false });

        req.flash('success', 'User Ban Date Has Been Updated');
        console.log('success');
        res.redirect('/admin/users/');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Updating User Ban Date');
        console.log('error');
        res.redirect('/admin/users/');
    }
});

router.post('/updateUserAccountCredit', async (req, res, next) => {

    //If no draw Result ID is submitted with the form
    if (!req.body.userID) {
        req.flash('error', 'User ID Missing');
        return res.redirect('/admin/users');
    }

    var accountCredit = req.body.accountCredit; 

    //Lookup username and find userID
    var returnedUser = await User.findById(req.body.userID);
        
    if(!returnedUser){
        req.flash('error', 'UserID not found');
        return res.redirect('/admin/users');
    }

    var userAccountCreditUpdate = {
        accountCredit: accountCredit,
        lastUpdated: new Date().toISOString(),
    };

    try {
        await User.findOneAndUpdate({ _id: req.body.userID }, userAccountCreditUpdate, { upsert: false });

        req.flash('success', 'User Account Credit Has Been Updated');
        console.log('success');
        res.redirect('/admin/users/');
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Updating User Account Credit');
        console.log('error');
        res.redirect('/admin/users/');
    }
});

////////////Find Order Details from submitted form////////////
router.post('/viewOrders', async (req, res, next) => {

    var orderLookupInfo = req.body.orderLookupInfo;
    //If no draw Result ID is submitted with the form
    if (!orderLookupInfo) {
        req.flash('error', 'Order Information input is missing');
        return res.redirect('/admin/viewOrders');
    }

    try {
        //Try find order by id
        var foundOrder;
        if(ObjectId.isValid(orderLookupInfo)){
            foundOrder = await Order.findById({_id: orderLookupInfo});
        }

        //If order not found from OrderID, try look for user details
        if(!foundOrder){
            var foundUser = await findUserID(orderLookupInfo);

            //If userID found, lookup last 25 orders
            if(foundUser){
                foundOrder = await Order.find({ userReference: foundUser._id });
            }
        }

        //if order is found
        if(foundOrder){
            res.render('admin/viewOrders', { title: 'View Orders', active: { orders: true }, orderInfo: foundOrder});
        } else {
            res.render('admin/viewOrders', { title: 'View Orders', active: { orders: true }, errors: true, error: ["Order Details Not Found"]});
        }
    } catch (err) {
        console.log(err);
        req.flash('error', 'Error Finding Orders');
        res.redirect('/admin/viewOrders/');
    }
});
///////////////////////////////////////////////////////////////////////////////////


///////////////////////////////Test Routes//////////////////////////////////////
/*
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

router.get('/decreasePending', async (req, res, next) => {

    var entriesToReduce = 10;

    try{
        var competitionPendingUpdate = {
            $inc: { 'pendingEntries': -entriesToReduce },
            lastUpdated: new Date().toISOString(),
        };
        await Competition.findOneAndUpdate({ _id: '665f555b3049fd153f57ab37' }, competitionPendingUpdate, { upsert: false });

    } catch (err) {
        console.log(err);
    }
    return res.redirect('/admin/competitionEntries/665f555b3049fd153f57ab37');
});
*/
/////////////////////////////////////////////////////////////////////////////////

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

// Function to delete all sessions /// Not used, backup functionality
async function clearAllBaskets() {

    try {
        // Find all session documents
        const sessionDocs = await Session.find({});

        for (let doc of sessionDocs) {
            try {
                let sessionObj = JSON.parse(doc.session);
                if (sessionObj.basket) {
                    delete sessionObj.basket;
                    doc.session = JSON.stringify(sessionObj);
                    await doc.save();
                    console.log(`Updated session with _id: ${doc._id}`);
                }
            } catch (err) {
                console.error(`Error processing session with _id: ${doc._id}`, err);
            }
        }

        //const result = await Session.updateMany({}, { $set: { "session.basket": {} } });
        //console.log(`${result.modifiedCount} baskets have been cleared.`);
        console.log('All baskets have been cleared.');
    } catch (err) {
    console.error('Error clearing baskets:', err);
    }
}

//Search username/email/userID to find a users account
async function findUserID(userInfo) {
    try {
        var foundUser;
        foundUser = await User.findOne({ "emailAddress" : { $regex : new RegExp('^'+userInfo+'$', "i") } });
        if(foundUser){
            return foundUser._id;
        }
        foundUser = await User.findOne({ "username" : { $regex : new RegExp('^'+userInfo+'$', "i") } });
        if(foundUser){
            return foundUser._id;
        }
        if(ObjectId.isValid(userInfo)){
            foundUser = await User.findById({_id: userInfo});
            if(foundUser){
                return foundUser._id;
            }
        }
        return false;
    } catch (err) {
        console.error(err);
    }
}

//Search orders for ID in Basket
async function findPostalEntry(userID, competitionID) {
    try {
    const userPostalOrders = await Order.find({userReference: userID, paymentID: 'PostalEntry'});
    var postalVoteEntries = 0;
        
    userPostalOrders.forEach(order => {
        order.basket.forEach(basketItem => {
            //console.log('Basket Item:', basketItem);

            // Assuming `item` is an object or an array containing an `_id` field
            if (Array.isArray(basketItem.item)) {
                basketItem.item.forEach(item => {
                    //console.log('Item in array:', item);

                    if (item._id == competitionID) {
                        console.log(`Found item in order ${order._id}`);
                        postalVoteEntries++;
                        // Do something with the found item
                    }
                });
            } else {
                //console.log('Single item:', basketItem.item);

                if (basketItem.item._id && basketItem.item._id == competitionID) {
                    console.log(`Found item in order ${order._id}`);
                    postalVoteEntries++;
                    // Do something with the found item
                }
            }
        });
    });
    return postalVoteEntries;
    } catch (err) {
        console.error(err);
    }
}