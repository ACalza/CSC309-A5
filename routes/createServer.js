var express = require('express');
var router = express.Router();
var serverDb = require('../serverDb');

//create server
router.post('/', function (req, res, next) {

    serverDb.count({
            serverIP: req.body.serverIP
        }, function (err, result) {
            if (result != 0) {
                res.render('createServer', {
                    error: 'This server is already registered'
                });
            } else {
                var serverJSON = get_ServerInfo(req.body.serverIP, req.body.portnum);
                //we need the get_ServerInfo function that returns the JSON object
                var newuser = new serverDb({
                    serverIP: req.body.serverIP,
                    domain: serverJSON.domain,
                    port: req.body.portnum,
                    url: serverJSON.url,
                    info: {
                        name: serverJSON.info.name,
                        platform: serverJSON.info.platform,
                        version: serverJSON.info.version,
                        type: serverJSON.info.type,
                        maxPlayerNumber: serverJSON.info.max_players
                    },
                    dateAdded: Date.now(),
                    geo: {
                        country: serverJSON.geo.country,
                        city: serverJSON.geo.city
                    },
                    lastUpdate: serverJSON.last_update,
                    upTime: serverJSON.uptime,
                    online: serverJSON.counter.online,
                    offline: serverJSON.counter.offline,
                    software: serverJSON.info.software, //ex. CraftBukkit on Bukkit 1.8.8-R0.1-SNAPSHOT
                    plugins: serverJSON.info.plugins
                });
            }
        }
    })
});

module.exports = router;