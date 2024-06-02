var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var winnerSchema = new Schema({
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    competitionReference: {type: Schema.Types.ObjectId, ref: 'Competition', required: true},
    visible: {type: Boolean, required: true, default: false},
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Winner', winnerSchema);