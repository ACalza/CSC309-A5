var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//Create and compile schema
var commentSchema = Schema({
    server: Schema.Types.ObjectId,
    poster: Schema.Types.ObjectId,
    text: String,
    //rating: Number, //0 - No rating, 1 - dislike, 2 - liked
    verified: Boolean // Has the user been known to play on this server?
});

module.exports = mongoose.model('Comment', commentSchema);
