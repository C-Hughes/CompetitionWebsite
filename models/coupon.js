var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: false},
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: false},
    isSiteWide: {type: Boolean, required: true, default: false},
    couponCode: {type: String, required: true},
    couponExpiryDate: {type: Boolean, required: true, default: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Coupon', couponSchema);