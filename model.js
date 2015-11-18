var mongoose = require('mongoose');
var User = null;

mongoose.connect('mongodb://localhost/users');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {

    console.log("DB Connect");
});

//Create and compile schema
var userSchema = mongoose.Schema({
    displayName: String,
    email: String,
    password: String,
    type: String,
    img: String,
    description: String,
    pages: [String],
    pageVisits: [Number],
    loginIPs: [String],
    loginDevices: [String],
    loginDates: [String],
    loginLocations: [String]
});
User = mongoose.model('User', userSchema);

module.exports = User;