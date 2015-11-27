var mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema);;
