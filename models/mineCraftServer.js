var mongoose = require('mongoose');

/**
 * Server schema
 */
var mineCraftServer = mongoose.Schema({
    ip: String,
    port: Number
});

module.exports = mongoose.model('MineCraftServer', mineCraftServer);
