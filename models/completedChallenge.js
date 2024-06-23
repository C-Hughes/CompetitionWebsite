var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var completedChallengeSchema = new Schema({
    userReference: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengeReference: { type: Schema.Types.ObjectId, ref: 'userChallenge', required: true },
    completed: { type: Boolean, default: false, required: true },
    progress: { type: Number, default: 0, required: true },
    created: {type: Date, default: Date.now, required: true},
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('completedChallenge', completedChallengeSchema);