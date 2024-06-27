var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userChallengeSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    icon: {type: String, required: true},
    points: {type: Number, required: true},
    accountCredit: {type: Number, required: false},
    voucherDescription: {type: String, required: false},
    active: {type: Boolean, required: true, default: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('userChallenge', userChallengeSchema);