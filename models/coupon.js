var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: false},
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: false},
    sitewide: {type: Boolean, required: true, default: false},
    couponCode: {type: String, required: true},
    couponAmount: {type: Number, required: false},
    couponPercent: {type: Number, required: false},
    couponExpiryDate: {type: Date, required: true},
    numberOfUsesPerPerson: {type: Number, required: true, default: 1},
    totalNumberOfUses: {type: Number, required: true, default: 0},
    timesUsed: {type: Number, required: true, default: 0},
    active: {type: Boolean, required: true, default: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Coupon', couponSchema);