var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: false},
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: false},
    isSitewide: {type: Boolean, required: true, default: false},
    couponCode: {type: String, required: true},
    couponAmount: {type: Number, required: false},
    couponPercent: {type: Number, required: false},
    couponExpiryDate: {type: Boolean, required: true, default: false},
    numberOfUses: {type: Number, required: true, default: 1},
    active: {type: Boolean, required: true, default: true},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Coupon', couponSchema);