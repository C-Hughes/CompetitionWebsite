const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bannerSchema = new Schema({
    isVisible: { type: Boolean, default: false },
    lastUpdated: {type: Date, default: Date.now, required: true},
});

module.exports = mongoose.model('Banner', bannerSchema);