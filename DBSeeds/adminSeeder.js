var User = require('../models/user');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_CONNECT, {
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
newUser.joinDate = new Date();
newUser.lastLogin = new Date();
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