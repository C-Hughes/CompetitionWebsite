var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var drawResultSchema = new Schema({
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: true},
    userReference: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    winningTicketNumber: {type: Number, required: true},
    visible: {type: Boolean, required: true, default: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('drawResults', drawResultSchema);