var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var adminSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    password: {type: String, required: true},
    joindate: {type: Date, default: Date.now, required: true},
    lastlogin: {type: Date, default: Date.now, required: true}
});

adminSchema.methods.encryptPassword = function(password){
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
};

adminSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);