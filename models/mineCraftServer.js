var mongoose = require('mongoose');

/**
 * Server schema
 */
var mineCraftServer = mongoose.Schema({
    ip: String,
    domain: String,
    port: String,
    url: String,
    info: {
        name: String,
        platform: String,
        version: String, //ex. 1.8.0
        type: String, //ex. SMP
        maxPlayerNumber: Number
    },
    dateAdded: String,
    geo: {
        country: String,
        city: String
    },
    lastUpdate: String,
    upTime: Number,
    online: Number,
    offline: Number,
    software: String, //ex. CraftBukkit on Bukkit 1.8.8-R0.1-SNAPSHOT
    plugins: [String]
});

module.exports = mongoose.model('MineCraftServer', mineCraftServer);
