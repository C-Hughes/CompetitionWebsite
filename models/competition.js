var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var competitionSchema = new Schema({
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    cashAlternative: {type: Number, required: false},
    price: {type: Number, required: true},
    drawDate: {type: Date, required: true},
    //entriesReference: {type: Schema.Types.ObjectId, ref: 'Entries', required: true},
    maxEntries: {type: Number, required: true},
    maxEntriesPerPerson: {type: Number, required: true, default: 100},
    maxPostalVotes: {type: Number, required: true, default: 1},
    questionText: {type: String, required: true},
    questionAnswers: [{type: String, required: true}],
    correctAnswer: {type: String, required: true},
    created: {type: Date, required: true}
});

module.exports = mongoose.model('Competition', competitionSchema);