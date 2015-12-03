var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var serverQuery = require("../lib/server-info.js");
var mcData = require("minecraft-data")
var stats = null;
//create server
router.post('/createServer', function (req, res) {
    serverDb.count({
        ip: req.body.ip,
        port: req.body.port
    }, function (err, result) {
        if (err) {
            console.error(err);
            return res.send("500 Internal Server Error");
        }
        if (result != 0) {
            res.render('createServer', {
                error: 'This server is already registered'
            });
        } else {
            serverQuery(function (stat) {
                var server = {
                    ip: stat.from.address,
                    port: stat.from.port,
                    title: stat.hostname,
                    gameMode: stat.gametype,
                    version: stat.version,
                    map: stat.map,
                    maxPlayers: stat.maxplayers
                }
                create_server(req, res, server);
            });
        }
    })
});

function create_server(req, res, server) {
    var newServer = new serverDb({
        ip: server.ip,
        title: server.title,
        gameMode: server.gameMode,
        version: server.version,
        map: server.map,
        maxPlayers: server.maxPlayers,
        port: server.port
    });
    newServer.save(function (err, newServer) {
        if (err) {
            res.status(500);
            res.render('error', {
                message: "Database error",
                error: err
            });
        } else {
            console.log(newServer);
            res.send("SAVED!");
        }
    });
}



module.exports = router;
