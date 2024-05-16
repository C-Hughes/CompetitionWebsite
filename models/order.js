var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    orderNumber: {type: Number, required: true},
    basket: {type: Object, required: true},
    shippingAddressReference: {type: Schema.Types.ObjectId, ref: 'ShippingAddress', required: false},
    billingAddressReference: {type: Schema.Types.ObjectId, ref: 'BillingAddress', required: true},
    paymentID: {type: String, required: true},
    paymentPrice: {type: Number, required: true},
    created: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Order', orderSchema);