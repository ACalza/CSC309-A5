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

function parsePlugins(plugins) {
    plugins = plugins.replace(':', ';');
    plugins = plugins.replace(/\s[^\s]+(?=;|$)/gi, ""); //Remove version numbers

    return plugins.split(';').map(function (str) {
        return str.trim();
    });
}

function ping_server(ip, port, callback) {
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
                hostname: results.description.replace(/\u00A7[0-9a-fk-r]/gi, ''),
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
                gametype: "UNK",
                plugins: []

            };
            callback(null, stat);
        }
    });
}
/**
 * UnlimitedPings is a boolean that will always keep pinging if true
 */
function stat_server(ip, port, unlimitedPings, callback) {
    var query = new Query(ip, port);
    var stop = false;
    query.connect(function (err) {
        if (stop) {
            return;
        } else {
            stop = true;
        }
        if (err) {
            //            try {
            //                query.close();
            //            } catch (ex) {
            //                console.warn("Could not close query");
            //            }
            if (unlimitedPings) {
                console.log("Full Stat could not connect, falling back to ping");

                //Server does not have Query protocols enabled, fallback to simple ping
                ping_server(ip, port, callback);
            } else {
                callback(err, null);
            }
        } else {
            try {
                query.full_stat(function (err, stat) {
                    if (err) {
                        query.close();
                        console.log("Stat Failure: " + err);
                        callback(err, null);
                    } else {
                        query.close();
                        stat.plugins = parsePlugins(stat.plugins);
                        stat.hostname = stat.hostname.replace(/[\u00A7\ufffd&][0-9a-fk-r]/gi, '').replace(/\s+/mg, ' ');
                        callback(null, stat); //TODO: Fallback to basic ping
                    }
                });
            } catch (err) {
                query.close();
                if (unlimitedPings) {
                    console.error("Error with stat " + err + ", falling back to ping");

                    ping_server(ip, port, callback);
                } else {
                    callback(err, null)
                }

            }


        }
    });
}

module.exports = stat_server;