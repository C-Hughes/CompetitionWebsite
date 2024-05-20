var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done){
   done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

///////////////////////SIGN UP///////////////////////////////////
passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'passwordS',
    passReqToCallback: true
}, function(req, username, password, done){

    var email = req.body.email;
    var passwordConf = req.body.pass2;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;

    //Strip illegal characters from username
    var rx = new RegExp;
    rx = /[^a-z0-9-_]/gi;
    username.replace(rx, "");

    //Input Validation
    req.checkBody('username', 'Username cannot be empty').notEmpty();
    req.checkBody('email', 'Email address cannot be empty').notEmpty();
    req.checkBody('passwordS', 'Password cannot be empty').notEmpty();
    req.checkBody('firstName', 'First name cannot be empty').notEmpty();
    req.checkBody('lastName', 'Last name cannot be empty').notEmpty();
    req.checkBody('username', 'Username Must be between 2 and 20 characters').isLength({min:2, max:20});
    req.checkBody('passwordS', 'Password must be at least 8 characters').isLength({min:8});
    req.checkBody('passwordS', 'Passwords do not match').equals(passwordConf);
    req.checkBody('email', 'Email is not valid').isEmail();

    var errors = req.validationErrors();
    if (errors){
        var sMessages = [];
        errors.forEach(function(error){
            sMessages.push(error.msg);
        });
        return done(null, false, req.flash('sError', sMessages));
    }

    //Check if email already exists
    User.findOne({'emailAddress': email})
    .then((user) => {
        if (user && email != "") {
            return done(null, false, req.flash('sError', 'Email is already in use.'));
        } else {
            //Check if username already exists
            User.findOne({'username':username})
            .then((foundUser) => {
                if (foundUser) {
                    return done(null, false, req.flash('sError', 'Username is already in use.'));
                    
                }

                //Generate new referralcode

                var newUser = new User();
                newUser.username = username;
                newUser.password = newUser.encryptPassword(passwordConf);
                newUser.emailAddress = email;
                newUser.firstName = firstName;
                newUser.lastName = lastName;
                newUser.displayName = username;
                newUser.joindate = new Date();
                newUser.lastlogin = new Date();
                newUser.save({})
                .then(() => {
                    return done(null, newUser);
                })
                .catch(err => {
                console.log(err);
                });
            })
            .catch(err => {
            console.log(err);
          });
        }
    })
    .catch(err => {
    console.log(err);
    });
}));

//////////////////////Login strategy////////////////////////////
passport.use('local.login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'passwordL',
    passReqToCallback: true
}, function(req, username, password, done){

    var email = req.body.email;

    //Input Validation
    req.checkBody('username', 'Username is empty').notEmpty();
    req.checkBody('passwordL', 'Password is empty').notEmpty();


    var errors = req.validationErrors();
    if (errors){
        var lMessages = [];
        errors.forEach(function(error){
            lMessages.push(error.msg);
        });
        return done(null, false, req.flash('lError', lMessages));
    }

    //Find email for login
    User.findOne({'email': email})
    .then((user) => {
        if (user) {
            //If user found and password is valid
            if(user.validPassword(password)){
                return done(null, user);
            } else {
                return done(null, false, req.flash('lError', 'Username or Password is incorrect'));
            }
        } else {
            //Find username for login
            User.findOne({'username':username})
            .then((foundUser) => {
                if (foundUser && foundUser.validPassword(password)) {
                    return done(null, foundUser);
                } else {
                    return done(null, false, req.flash('lError', 'Username or Password is incorrect'));
                }
            })
                .catch(err => {
                console.log(err);
          });
        }
    })
      .catch(err => {
        console.log(err);
    });
}));


///////////////////////////////Update Password////////////////////////////////
passport.use('local.updatePassword', new LocalStrategy({
    usernameField: 'newPassword',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, newPassword, password, done){

    //var newPassword = req.body.newPassword;
    var newPasswordConf = req.body.newPasswordConf;

    //Input Validation
    req.checkBody('password', 'Password is empty').notEmpty();
    req.checkBody('password', 'New Password is empty').notEmpty();
    req.checkBody('password', 'Confirm New Password is empty').notEmpty();
    req.checkBody('newPasswordConf', 'Password must be at least 8 characters').isLength({min:8});
    req.checkBody('newPassword', 'Passwords do not match').equals(newPasswordConf);

    var errors = req.validationErrors();
    if (errors){
        var UPMessages = [];
        errors.forEach(function(error){
            UPMessages.push(error.msg);
        });
        return done(null, false, req.flash('error', UPMessages));
    }

    //Current if current password correct
    if(req.user.validPassword(password)){
        //Generate hash of new password to update
        var newPass = req.user.encryptPassword(newPasswordConf);

        User.findOneAndUpdate({_id: req.user}, {password: newPass, lastUpdated: Date.now()}, {upsert: false})
        .then((foundUser) => {
            if (foundUser) {
                //Password has been updated
                return done(null, false, req.flash('success', 'Your password has been updated'));
            } else {
                return done(null, false, req.flash('error', 'User or Password incorrect'));
            }
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        return done(null, false, req.flash('error', 'User or Password incorrect'));
    }


}));