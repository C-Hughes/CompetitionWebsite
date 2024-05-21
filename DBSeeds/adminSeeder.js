var User = require('../models/user');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CompetitionMain', {
    serverSelectionTimeoutMS: 5000
});

var Users = [
    new User({
        username: 'Admin',
        password: '$2a$10$1aZux30s2YM01jb0ik3mcOIxdi0Kkl78YQrXu37QlueqrOKQXugqC',
        firstName: 'Admin',
        lastName: 'Admin',
        displayName: 'Admin',
        emailAddress: 'Admin@admin.com',
        referralCode: 'ADMINREFERRAL',
        isAdmin: true,
    }),
];

var finished = 0;
for (var i =0; i < Users.length; i++){
    Users[i].save().then(()=>{
        console.log(finished);
        finished++
        if(finished === Users.length){
            exit();
            console.log('Exit');
        }
    }).catch((err)=>{
        console.log(err);
    })


}

function exit(){
    mongoose.disconnect();
}


//   cd ../../../../../ 
//   cd '.\Program Files\MongoDB\Server\4.2\bin'