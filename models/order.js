var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    basket: {type: Object, required: true},
    shippingAddressReference: {type: Schema.Types.ObjectId, ref: 'ShippingAddress', required: true},
    billingAddressReference: {type: Schema.Types.ObjectId, ref: 'BillingAddress', required: true},
    paymentID: {type: Object, required: true},
    created: {type: Date, required: true},
});

module.exports = mongoose.model('Order', orderSchema);