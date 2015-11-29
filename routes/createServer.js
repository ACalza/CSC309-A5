var express = require('express');
var router = express.Router();
var serverDb = require('./mineCraftServer');

//create server
router.post('/', function (req, res, next) {

    serverDb.count({
        ip: req.body.ip
    }, function (err, result) {
        if (result != 0) {
            res.render('createServer', {
                error: 'This server is already registered'
            });
        } else {
            get_ServerInfo(req.body.ip, req.body.port, function (err, result) {
                if !(err) {
                    create_server(result);
                }
            });
        }
    })
});

function create_server(server) {
    var newServer = new serverDb({
        ip: server.ip,
        title: server.title,
        gameMode: server.gameMode,
        gameId: server.GameId,
        version: server.version,
        plugins: server.plugins,
        map: server.map,
        numPlayersOnline: server.numPlayersOnline,
        maxPlayers: server.maxPlayers,
        fromIP: server.fromIP,
        port: server.port,
        onlineplayers: server.onlineplayers
    });
    newServer.save(function (err, newServer) {
        if (err) {
            console.error(err);
        }
    });
}

function get_ServerInfo(ip, port, callback) {
    //Do fancy stuff here...

    var result = {
        ip: "!",
        title: "1",
        gameMode: 1,
        gameId: 1,
        version: "1",
        plugins: "1",
        map: "1",
        numPlayersOnline: 1,
        maxPlayers: 1,
        fromIP: "!",
        port: 1,
        onlineplayers: ["1"]
    }

    callback(false, result);
}

module.exports = router;