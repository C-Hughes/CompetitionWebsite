var User = require('../models/user');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CompetitionMain', {
    serverSelectionTimeoutMS: 5000
});

var newUser = new User();
newUser.username = 'Admin';
newUser.password = newUser.encryptPassword('qqqqqqqq');
newUser.firstName = 'Admin';
newUser.lastName = 'Admin';
newUser.displayName = 'Admin';
newUser.emailAddress = 'Admin@admin.com';
newUser.referralCode = 'ADMINREFERRAL';
newUser.isAdmin = true;
newUser.joindate = new Date();
newUser.lastlogin = new Date();
newUser.save({})
.then(() => {
    console.log('Admin saved!');
    exit();
})
.catch(err => {
    console.log(err);
});

function exit(){
    mongoose.disconnect();
}


//   cd ../../../../../ 
//   cd '.\Program Files\MongoDB\Server\4.2\bin'