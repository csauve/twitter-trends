var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var HashtagSnapshot = new Schema({
    hashtag: {type: String, required: true, lowercase: true, trim: true},
    popularityIndex: {type: Number, required: true},
    sentimentIndex: {type: Number, required: true},
    sharingIndex: {type: Number, required: true},
    dateCreated: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model("HashtagSnapshot", HashtagSnapshot);