var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var userSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    DOB: {type: String, required: false},
    emailComms: {type: Boolean, required: true, default: false},
    textComms: {type: Boolean, required: true, default: false},
    postComms: {type: Boolean, required: true, default: false},
    rewardPoints: {type: String, default: 0},
    rewardLevel: {type: String, default: "Bronze (Level 1)"},
    joindate: {type: Date, default: Date.now, required: true},
    lastlogin: {type: Date, default: Date.now, required: true}
});

userSchema.methods.encryptPassword = function(password){
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
};

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);