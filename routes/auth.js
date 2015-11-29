var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require("../models/index");
var util = require('../util');
var googleAuth = require('../auth/google');
var uaparse = require('ua-parser-js');


googleAuth(router, googleAuthComplete);

function authComplete(user, req, res, next) {
    if (!req.session.curUser)
        user = updateUserAnalytics(user, req);

    util.saveModel(user, function (err) {
        console.log(err);
        //TODO: Show error
    }, function (user) {
        req.session.curUser = user;
        res.redirect('/profile');
    });

}

function googleAuthComplete(getinfo_response, req, res, next) {
    models.User.findOne({
        email: getinfo_response.email
    }, function (err, user) {
        if (err) {
            console.log(err);
            //TODO: Show error
        } else {
            if (user) {
                //Already have a user in our database with this username
                authComplete(user, req, res, next);
            } else {
                //Now things get a bit complicated. We need to make a new user.
                var u = new models.User({
                    displayName: getinfo_response.name,
                    email: getinfo_response.email,
                    type: "User",
                    img: getinfo_response.picture ? getinfo_response.picture : "http://gravatar.com/avatar/" + util.md5hash(getinfo_response.email),
                    description: ""
                });
                util.saveModel(u, function (err) {
                    console.log(err);
                }, function (user) {
                    authComplete(user, req, res, next);
                });
            }
        }

    });
}

function updateUserAnalytics(user, req) {
    //Log login analytics
    user.loginDates.push(new Date().toDateString())
    user.loginIPs.push(req.ip);

    var ua = uaparse(req.headers['user-agent']);
    var device = ua.device;

    var devString = (device.type ? device.type : "Desktop") + "/" + (device.vendor ? device.vendor : ua.os.name + " " + ua.os.version) + "/" + (device.vendor ? device.vendor : (device.model ? device.model : "Unknown Model"));
    user.loginDevices.push(devString);
    //user.loginLocations.push(loc); //FIXME: Pull this out of somewhere else
    return user;
}


module.exports = router;