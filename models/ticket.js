var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ticketSchema = new Schema({
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: true},
    competitionTitle: {type: String, required: true},
    competitionDrawDate: {type: Date, required: true},
    //orderReference: {type: Schema.Types.ObjectId, ref: 'Order', required: true},
    //basket: {type: Object, required: true},
    //paymentID: {type: String, required: true},
    ticketQty: {type: Number, required: true},
    compAnswer: {type: String, required: true},
    ticketNumbers: [{type: Number, required: true}],
    ticketNumbersObjects: [{type: Object, required: true}],
    //mostRecentlyPurchasedTicketNumbers: [{type: Number, required: true}],
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true}
});

module.exports = mongoose.model('Ticket', ticketSchema);