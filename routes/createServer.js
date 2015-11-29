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
                    create_server(result.ip, result.title, result.gameMode, result.gameId, result.version, result.plugins, result.map,
                        result.numPlayersOnline, result.maxPlayers, result.fromIP, result.port, result.onlinePlayers);
                }
            });
        }
    })
});

function create_server(ip, title, gameMode, gameId, version, plugins, map, numPlayersOnline, maxPlayers, fromIP, port, onlinePlayers) {
    var newServer = new serverDb({
        ip: ip,
        title: title,
        gameMode: gameMode,
        gameId: GameId,
        version: version,
        plugins: plugins,
        map: map,
        numPlayersOnline: numPlayersOnline,
        maxPlayers: maxPlayers,
        fromIP: fromIP,
        port: port,
        onlineplayers: onlineplayers
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