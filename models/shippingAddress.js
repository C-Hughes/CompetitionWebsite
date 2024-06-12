var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shippingAddressSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    countryRegion: {type: String, required: false},
    streetAddress1: {type: String, required: true},
    streetAddress2: {type: String, required: false},
    townCity: {type: String, required: true},
    county: {type: String, required: false},
    postcode: {type: String, required: true},
    phoneNumber: {type: String, required: false},
    emailAddress: {type: String, required: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('ShippingAddress', shippingAddressSchema);