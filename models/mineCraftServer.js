var mongoose = require('mongoose');

/**
 * Server schema
 */
var mineCraftServer = mongoose.Schema({
    ip: String,
    title: String,
    gameMode: Number,
    gameId: Number,
    version: String,
    plugins: String,
    map: String,
    numPlayersOnline: Number,
    maxPlayers: Number,
    fromIP: String,
    port: Number,
    onlineplayers: [String]
});

module.exports = mongoose.model('MineCraftServer', mineCraftServer);
