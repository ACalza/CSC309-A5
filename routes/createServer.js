var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var serverQuery = require("../lib/server-updater.js");
var mcData = require("minecraft-data")
var stats = null;
//create server
router.post('/', function(req, res) {

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

            create_server(req, res, {
                ip: req.body.ip,
                port: req.body.port
            });
        }
    })
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
                console.log(model);
                res.send("OK"); //TODO: Redirect to server view
            });
        }
    });
}



module.exports = router;
