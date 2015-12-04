var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var Comment = require('../models/index').Comment;

var serverQuery = require("../lib/server-updater.js");

//create server
router.post('/create', function (req, res) {
    if (!req.body.ip) {
        res.render('createServer', {
            error: 'Please enter an IP'
        });
    }
    if (!req.body.port) {
        req.body.port = 25565;
    }
    serverDb.count({
        ip: req.body.ip,
        port: req.body.port
    }, function (err, result) {
        console.log(req.body.ip + ":" + req.body.port + " = " + result);
        if (err) {
            console.error(err);
            return res.send("500 Internal Server Error");
        }
        if (result != 0) {
            res.render('createServer', {
                error: 'This server is already registered'
            });
        } else {

            create_server(req, res, {
                ip: req.body.ip,
                port: req.body.port
            });
        }
    });
});


function create_server(req, res, server) {
    var newServer = new serverDb({
        ip: server.ip,
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
            serverQuery.updateOneServerModel(newServer, function (err, model) {
                if (err) {
                    res.render('createServer', {
                        error: 'Error occured communicating with the server. Please make sure it is online. Error was ' + err;
                    });
                }
                console.log(model);
                res.send("OK"); //TODO: Redirect to server view
            });
        }
    });
}

router.get('/list', function (req, res, next) {
    serverDb.find({}, function (err, result) {
        if (err) {
            console.error(err);
            return res.send("500 Internal Server Error");
        } else {
            res.render('servers', {
                user: req.session.curUser,
                servers: result
            });
        }
    });
});

//TODO: Move to router?
router.post('/comment/add/:server_id', function (req, res, next) {
    if (!req.session.curUser) {
        res.json({
            error: "Not logged in"
        });
    }
    if (!req.params.server_id || !req.body.text) {
        res.json({
            error: "Server or text empty"
        });
    }
    serverDb.findOne({
        _id: req.params.server_id //TODO: Invalid server_id might cause crash if not proper format
    }, function (err, server) {
        if (err) {
            res.json({
                error: "Database error - " + err
            });
        } else if (server == 0) {
            res.json({
                error: "Server id not found"
            });
        } else {
            var comment = new Comment({
                poster: req.session.curUser._id,
                server: server._id,
                text: req.body.text,
                verified: req.session.curUser.accountSource == "Minecraft" && server.playerHistory.indexOf(req.session.curUser.displayName) >= 0
            });
        }
    });

});

module.exports = router;
