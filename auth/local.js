var util = require('../util');
var uaparse = require('ua-parser-js');
var models = require("../models/index");
var bcrypt = require("bcrypt");

var local = function (router, authCompleteCallback) {
    router.get('/local/login', function (req, res, next) {
        if (req.session.curUser != null) {
            authCompleteCallback(req.session.curUser, req, res, next);
            return;
        }
        res.render('login');
    });
    router.post('/local/login', function (req, res, next) {
        //Logged in users can't access
        if (req.session.curUser != null) {
            res.redirect('/profile');
            return;
        }
        req.sanitize('email').escape();
        req.sanitize('password').escape();
        var email = req.body.email;
        var pass = req.body.password;
        if (!email || !pass) {
            res.render('login', {
                errorMsg: "Please enter an email and password"
            });
        }
        var loc = req.body.location;


        models.User.findOne({
            email: email
        }, function (err, user) {
            var hash = user.password;
            if (user && bcrypt.compareSync(util.md5hash(req.body.password), hash)){
                authCompleteCallback(user, req, res, next);
            } else {
                //No match - wrong email or password
                res.render('login', {
                    errorMsg: "Sorry, wrong email/password."
                });
            }

        });
    });
}


module.exports = local;
