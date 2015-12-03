var mongoose = require('mongoose');

//Create and compile schema
var commentSchema = mongoose.Schema({
    server: ObjectID,
    poster: ObjectID,
    text: String,
    rating: Number
});

module.exports = mongoose.model('Comment', commentSchema);
