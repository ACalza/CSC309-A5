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

var Query = require("mcquery");

function stat_server(callback) {
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
                    callback(stat); //TODO: Fallback to basic ping
                }
            });

        }
    });
}

module.exports = stat_server;
