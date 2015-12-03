var mongoose = require('mongoose');

/**
 * Server schema
 */
var mineCraftServer = mongoose.Schema({
    ip: String,
    title: String,
    gameMode: String,
    gameId: Number,
    version: String,
    plugins: String,
    map: String,
    numPlayersOnline: Number,
    maxPlayers: Number,
    fromIP: String,
    port: Number,
    onlineplayers: [String],
    playerHistory: [String]
});

module.exports = mongoose.model('MineCraftServer', mineCraftServer);
