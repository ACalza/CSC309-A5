var serverDb = require('../models/index').MineCraftServer;
var serverQuery = require("../lib/server-info.js");
var sem = require('semaphore')(10);

function updateServerStats(done) {
    console.log("Starting server updates...");
    serverDb.find({}, function (err, servers) {

        servers.forEach(function (val, index) {
            sem.take(function () {
                updateServerModel(val, function (err, model) {
                    if (err) {
                        console.log("Batch update error - " + err);
                    }
                    sem.leave();
                });
            });
        });
        console.log("Finishing server updates (running last batch)");
        done();
    });
}

function updateServer(ip, port, done) {
    serverDb.findOne({
        ip: ip,
        port: port
    }, function (err, val) {
        if (err) {
            done(err, null);
        } else {
            updateServerModel(val, done);
        }
    });

}

function updateServerModel(val, done) {
    console.log("Querying " + val.ip + ":" + val.port);
    serverQuery(val.ip, val.port, function (err, stat) {
        val.fromIP = stat.from.address;
        val.port = stat.from.port;
        val.title = stat.hostname;
        val.gameMode = stat.gametype;
        val.version = stat.version;
        val.map = stat.map;
        val.maxPlayers = stat.maxplayers;
        val.numPlayersOnline = stat.numplayers;
        val.onlineplayers = stat.player_;
        val.onlineplayers.forEach(function (plr, idx) {
            var idxInHistory = val.playerHistory.map(function (x) {
                return x.name;
            }).indexOf(plr);
            if (idxInHistory >= 0) {
                val.playerHistory[idxInHistory].lastOnline = new Date();
            } else {
                val.playerHistory.push({
                    name: plr,
                    lastOnline: new Date()
                });
            }
        });
        val.save(function (err, val) {
            if (err) {
                console.error("Failed to save server - " + err);
                done(err, null);
            }
            done(null, val);
        });

    });
}

module.exports = {
    updateAllServers: updateServerStats,
    updateOneServer: updateServer,
    updateOneServerModel: updateServerModel
};