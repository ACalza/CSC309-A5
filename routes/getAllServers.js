var express = require('express');
var router = express.Router();
var serverDb = require('../models/index').MineCraftServer;
var Query = require("mcquery");
var mcData = require("minecraft-data");

router.get('/', function (req, res, next) {
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

module.exports = router;
