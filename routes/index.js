//Routes
var auth = require("./auth");
var analytics = require("./analytics");
var profile = require("./profile");
var user = require("./user");
var server = require("./server");
var express = require("express");
var models = require("../models/index");

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.session.curUser) {

        //List all users
        models.User.find({}, function (err, users) {
            res.render('index', {
                user: req.session.curUser,
                allUsers: users
            });
        });
    } else {
        res.render('index');
    }
});

//All routes to be exported and added here
module.exports = {
    "auth": auth,
    "analytics": analytics,
    "profile": profile,
    "server": server,
    "user": user,
    "/": router
}