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
    plugins: [String],
    map: String,
    numPlayersOnline: Number,
    maxPlayers: Number,
    fromIP: String,
    port: Number,
    onlineplayers: [String],
    playerHistory: [{
        name: String,
        lastOnline: Date
    }],
    numLikes: Number,
    likes: [mongoose.Schema.Types.ObjectId]
});

module.exports = mongoose.model('MineCraftServer', mineCraftServer);