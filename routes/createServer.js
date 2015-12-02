var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var Query = require("mcquery");
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
            var query = new Query(req.body.ip, req.body.port);
            query.connect(function (err) {
                if (err) {
                    res.status(400);
                    res.render('error', {
                        message: "400 Bad Request",
                        error: err
                    });
                } else {
                    query.full_stat(function (err, stat) {
                        if (err) //Error handle to be cleaned up in a bit
                            return console.error(err);
                        else {
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
                        }
                    });

                }
            })
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

function fullStat(err, stat) {

}



module.exports = router;
