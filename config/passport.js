var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done){
   done(null, user.id);
});

passport.deserializeUser(function(id, done){
   User.findById(id, function(err, user){
       done(err,user);
   });
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, username, password, done){

    var email = req.body.email;
    var password = req.body.pass1;
    var passwordConf = req.body.pass2;
    var firstName = req.body.fisrtName;
    var lastName = req.body.lastName;

    //Strip illegal characters from username
    var rx = new RegExp;
    rx = /[^a-z0-9-_]/gi;
    username.replace(rx, "");

    //Input Validation
    req.checkBody('username', 'Username is empty').notEmpty();
    req.checkBody('username', 'Username Must be between 2 and 20 characters').isLength({min:2, max:20});
    req.checkBody('password', 'Password is empty').notEmpty();
    req.checkBody('password', 'Password must be at least 8 characters').isLength({min:8});
    req.checkBody('password', 'Passwords do not match').equals(passwordConf);
    req.checkBody('fisrtName', 'First name is empty').notEmpty();
    req.checkBody('lastName', 'Last name is empty').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();

    var errors = req.validationErrors();
    if (errors){
        console.log(errors);
        var sMessages = [];
        errors.forEach(function(error){
            sMessages.push(error.msg);
        });
        return done(null, false, req.flash('sError', sMessages));
    }

    //Check if email already exists
    User.findOne({'email': email})
    .then((user) => {
        if (user && email != "") {
            return done(null, false, {sMessage: 'Email is already in use.'});
        } else {
            //Check if username already exists
            User.findOne({'username':username})
            .then((foundUser) => {
                if (foundUser) {
                    return done(null, false, {sMessage: 'Username is already in use.'});
                }

                var newUser = new User();
                newUser.username = username;
                newUser.password = newUser.encryptPassword(passwordConf);
                newUser.email = email;
                newUser.firstName = firstName;
                newUser.lastName = lastName;
                newUser.joindate = new Date();
                newUser.lastlogin = new Date();
                newUser.save(function(err, result){
                    if (err){
                        return done(err);
                    }
                    return done(null, newUser);
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


///TODO
passport.use('local.login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, username, password, done){
//Input Validation
    req.checkBody('username', 'Username is empty').notEmpty();
    req.checkBody('password', 'Password is empty').notEmpty();

    var errors = req.validationErrors();
    if (errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }

    User.findOne({'email': username}, function (err, user) {
        if (err) {
            return done(err);
        }
        //If a user is returned with an email address that is not empty
        if (!user) {
            //Check if username already exists
            User.findOne({'username':username}, function(err, user){
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {message: 'Username or Password is incorrect'});
                }
                if(!user.validPassword(password)){
                    return done(null, false, {message: 'Username or Password is incorrect'});
                }
                return done(null, user);
            });
        } else {
            if(!user.validPassword(password)){
                return done(null, false, {message: 'Username or Password is incorrect'});
            }
            return done(null, user);
        }
    });
}));