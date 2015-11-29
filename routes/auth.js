var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var models = require("../models/index");
var util = require('../util');
var googleAuth = require('../auth/google');
var localAuth = require('../auth/local');
var minecraftAuth = require('../auth/minecraft');
var uaparse = require('ua-parser-js');


googleAuth(router, googleAuthComplete);
localAuth(router, authComplete);
minecraftAuth(router, minecraftAuthComplete);

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

function googleAuthComplete(data, req, res, next) {
    thirdPartyAuthComplete(data.email, data.name, data.picture, data.access_token, "Google", req, res, next);
}

function minecraftAuthComplete(data, req, res, next) {
    thirdPartyAuthComplete(data.email, data.name, data.picture, data.access_token, "Minecraft", req, res, next);
}

function thirdPartyAuthComplete(email, displayName, picture, access_token, auth_service, req, res, next) {
    models.User.findOne({
        email: email
    }, function (err, user) {
        if (err) {
            console.log(err);
            //TODO: Show error
        } else {
            var u = null;
            if (user) {
                u = user;
                //Already have a user in our database with this username, update
                u.displayName = displayName;
                u.email = email;
                u.img = picture;
                if (access_token) {
                    u.accessTokens[auth_service] = access_token;
                }
            } else {
                //We need to make a new user, based on the third-party auth
                u = new models.User({
                    displayName: displayName,
                    email: email,
                    type: "User",
                    img: picture,
                    description: "",
                    accountSource: auth_service,
                });
                if (access_token) {
                    u.accessTokens[auth_service] = access_token;
                }
            }
            util.saveModel(u, function (err) {
                console.log(err);
            }, function (user) {
                authComplete(user, req, res, next);
            });
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
    user.loginLocations.push('Unknown');
    //user.loginLocations.push(loc); //FIXME: Pull this out of somewhere else
    return user;
}


module.exports = router;