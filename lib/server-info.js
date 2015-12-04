//var mc = require('minecraft-protocol');
//var client = mc.createClient({
//    host: "localhost", // optional 
//    port: 25565, // optional 
//    username: "ChatServer",
//    version: "1.8.8"
//});
//client.on('chat', function (packet) {
//    // Listen for chat messages and echo them back. 
//    var jsonMsg = JSON.parse(packet.message);
//    if (jsonMsg.translate == 'chat.type.announcement' || jsonMsg.translate == 'chat.type.text') {
//        var username = jsonMsg.with[0].text;
//        var msg = jsonMsg.with[1];
//        if (username === client.username) return;
//        client.write('chat', {
//            message: msg
//        });
//    }
//});
//mc.ping({
//    host: "localhost",
//    port: 25565,
//    optVersion: "1.8.8"
//}, function (err, results) {
//    if (err) {
//        console.log(err);
//    } else {
//        console.log(results);
//    }
//});
var mc = require('minecraft-protocol');
var Query = require("mcquery");

function stat_server(ip, port, callback) {
    var query = new Query(ip, port);
    query.connect(function (err) {
        if (err) {
            console.log("Full Stat could not connect, falling back to ping");
            query.close();
            //Server does not have Query protocols enabled, fallback to simple ping
            mc.ping({
                host: ip,
                port: port,
                optVersion: "1.8.8"
            }, function (err, results) {
                if (err) {
                    console.log("Ping Failure: " + err);
                    callback(err, null);
                } else if (!results) {
                    console.log("Ping could not connect");
                    callback({
                        message: "Server is offline"
                    }, null);
                } else {
                    var stat = {
                        from: {
                            address: ip,
                            port: port
                        },
                        numplayers: results.players.online,
                        maxplayers: results.players.max,
                        player_: results.sample ? results.players.sample.map(function (plr) {
                            return plr.name
                        }) : [],
                        version: results.version.name,
                        game_id: "MINECRAFT",
                        gametype: "UNK"

                    };
                    callback(null, stat);
                }
            });
        } else {
            query.full_stat(function (err, stat) {
                if (err) {
                    query.close();
                    console.log("Stat Failure: " + err);
                    callback(err, null);
                } else {
                    callback(null, stat); //TODO: Fallback to basic ping
                }
            });

        }
    });
}

module.exports = stat_server;