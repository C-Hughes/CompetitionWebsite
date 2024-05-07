var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    displayName: {type: String, required: true},
    DOB: {type: String, required: true},
    emailComms: {type: Boolean, required: true, default: false},
    textComms: {type: Boolean, required: true, default: false},
    postComms: {type: Boolean, required: true, default: false},
    rewardPoints: {type: String, default: 0},
    rewardLevel: {type: String, default: "Bronze (Level 1)"},
    joindate: {type: Date, default: Date.now, required: true},
    lastlogin: {type: Date, default: Date.now, required: true}
});

userSchema.methods.encryptPassword = function(password){
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);