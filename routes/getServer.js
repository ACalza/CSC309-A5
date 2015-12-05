var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var Query = require("mcquery");
var mcData = require("minecraft-data");

router.get('/:ip', function (req, res) {
    serverDb.find({
        ip: req.params.ip
    }, function (err, result) {
        if (err) {
            console.log(err);
            return res.send('500 Internal Server Error');
        } else {
            var i;
            for (i = 0; i < result.length; i++) {
                if (String(result[i].port) == "25565") {
                    res.render('server', {
                        user: req.session.curUser,
                        server: result[i]
                    });
                } else {
                    return res.send('Server does not exist');
                }
            }
        }
    });

});


router.get('/:ip/:port', function (req, res) {
    var ip = req.params.ip
    var port = req.params.port
    serverDb.find({
        ip: ip
    }, function (err, result) {
        if (err) {
            console.log(err);
            return res.send('500 Internal Server Error');
        } else {
            var i;
            for (i = 0; i < result.length; i++) {
                if (String(result[i].port) == port) {
                    res.render('server', {
                        user: req.session.curUser,
                        server: result[i]
                    });
                } else {
                    return res.send('Server does not exist');
                }
            }
        }
    });

});


module.exports = router;
