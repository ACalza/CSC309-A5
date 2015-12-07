var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var util = require('../util');
var uaparse = require('ua-parser-js');
var User = require("../models/user");
var error503 = "Status 503, internal server error";

//Lists the users
router.get('/userlist', function (req, res, next) {
    if (req.session.curUser) {

        //List all users
        User.find({}, function (err, users) {
            res.render('users', {
                user: req.session.curUser,
                allUsers: users
            });
        });
    } else {
        res.render('users');
    }
});

//Lists the servers
router.get('/serverlist', function (req, res, next) {
    if (req.session.curUser) {

        //List all users
        User.find({}, function (err, users) {
            res.render('servers', {
                user: req.session.curUser,
                allUsers: users,
                servers: [
                    {
                        ip: "192.2.1.1",
                        title: "Test",
                        gameMode: "Normal",
                        gameId: 1,
                        version: 1,
                        plugins: 1,
                        map: "de_dust2",
                        numPlayersOnline: 10,
                        maxPlayers: 10,
                        fromIP: 12,
                        port: 27000,
                        onlineplayers: [String]
                    },
                    {
                        ip: "194.2.1.1",
                        title: "BestServNA",
                        gameMode: "Abnormal",
                        gameId: 1,
                        version: 1,
                        plugins: 1,
                        map: "de_aztec",
                        numPlayersOnline: 5,
                        maxPlayers: 10,
                        fromIP: 12,
                        port: 27050,
                        onlineplayers: [String]
                    },
                    {
                        ip: "127.0.0.1",
                        title: "YOLOSWAG",
                        gameMode: "SWAGMODE",
                        gameId: 1,
                        version: 1,
                        plugins: 1,
                        map: "de_swag",
                        numPlayersOnline: 0,
                        maxPlayers: 64,
                        fromIP: 12,
                        port: 666,
                        onlineplayers: [String]
                    }
                ]
            });
        });
    } else {
        res.render('index');
    }
});

//Find a user by mongo.objectID and return the JSON of the model
router.get('/find/:id', function (req, res, next) {
    req.sanitize('id').escape();
    User.findOne({
        _id: req.params.id
    }, function (err, user) {
        if (err) {
            res.status(503);
            console.error(err);
            res.render('error', {
                message: error503
            });
        } else if (!user) {
            res.json({
                error: "User id not found"
            });
        } else {
            //User found
            Result = user;
            res.json(Result);
        }
    });
});


/* GET register */
router.get('/register', function (req, res, next) {
    if (req.session.curUser != null) {
        res.redirect('/profile');
        return;
    }
    res.render('register');
});

/* POST register */
router.post('/register', function (req, res, next) {
    if (req.session.curUser != null) {
        res.redirect('/profile');
        return;
    }
    req.sanitize('email').escape();
    req.sanitize('password').escape();
    req.sanitize('displayName').escape();
    req.sanitize('confirmPassword').escape();
    req.sanitize('description').escape();


    //Read form fields
    var email = req.body.email.trim();
    var pass = req.body.password.trim();
    var cpass = req.body.confirmPassword.trim();
    var displayName = req.body.displayName.trim();
    var description = req.body.description.trim();

    //Validation (server side so document can't be altered to skip it)
    if (!email || email.length == 0) {
        res.status(400);
        res.render('register', {
            errorMsg: "Please enter your email",
            fieldStates: req.body
        });
        return;
    }

    //Blank display names allowed, set to email
    if (!displayName || displayName.length == 0) {
        displayName = email;
    }

    //Check if email already registered
    util.moreThanZero({
        email: email
    }, function () {
        res.status(500);
        res.render('register', {
            errorMsg: "Database error. Please try again later.",
            fieldStates: req.body
        });
    }, function () {
        //Email not registered
        //Further validation
        if (pass != cpass) {
            res.status(400);
            res.render('register', {
                errorMsg: "Passwords don't match",
                fieldStates: req.body
            });
            return;
        }

        //Create user instance
        var u = new User({
            displayName: displayName,
            email: email,
            password: util.bcrypt(util.md5hash(pass)),
            type: "User",
            img: "http://gravatar.com/avatar/" + util.md5hash(email),
            description: description,
            accountSource: "Local"
        });

        //Check to see if there is more than one user
        util.moreThanZero({
            //type: "SAdmin"
        }, function () {
            res.status(500);
            res.render('register', {
                errorMsg: "Database error. Please try again later.",
                fieldStates: req.body
            });
        }, function () {
            //There must always be at least one super admin (SAdmin), so make one if none exist
            u.type = "SAdmin";

            //Save new user
            util.saveModel(u, function (error) {
                res.status(500);
                res.render('register', {
                    errorMsg: "Database error. Please try again later.",
                    fieldStates: req.body
                });
            }, function (user) {
                //Login user, and show them their new profile
                req.session.curUser = user;
                res.redirect('/profile/');
            });
            console.log("Making user Super admin");
        }, function () {

            //Save new user
            util.saveModel(u, function (error) {
                res.status(500);
                res.render('register', {
                    errorMsg: "Database error. Please try again later.",
                    fieldStates: req.body
                });
            }, function (user) {
                //Login user, and show them their new profile
                req.session.curUser = user;
                res.redirect('/profile/');
            });
        });
    }, function () {
        //User found with email
        res.status(400);
        res.render('register', {
            errorMsg: "This email has already been used.",
            fieldStates: req.body
        });
    });
});

//----COMMANDS---- (GET only to be accessible by link)

// Logout
router.get('/logout', function (req, res, next) {
    req.session.curUser = null;
    res.redirect('/');
});

// Make a user into an Admin
router.get('/promote/:id', function (req, res, next) {
    req.sanitize('id').escape();
    //Only super admin can promote
    if (req.session.curUser.type == "SAdmin") {
        //Find the user
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {
                res.status(500);
                res.render('profile', {
                    errorMsg: "Database error"
                });
            } else if (!user) {
                res.status(404);
                res.render('error', {
                    user: req.session.curUser,
                    message: "User not found"
                });
            } else {
                //Promote
                user.type = "Admin";
                util.saveModel(user, function (error) {
                    res.status(500);
                    res.render('profile', {
                        user: req.session.curUser,
                        profUser: user,
                        errorMsg: "Database error."
                    });
                }, function (user) {
                    req.session.curUser = user;
                    res.render('profile', {
                        user: req.session.curUser,
                        profUser: user,
                        successMsg: "User has been promoted to Administrator."
                    });
                });
            }
        });
    } else {
        res.status(403);
        res.render('error', {
            user: req.session.curUser,
            message: "Unauthorized"
        });
    }
});

// Make an admin into a user
router.get('/demote/:id', function (req, res, next) {
    req.sanitize('id').escape();
    //Only super admin can demote
    if (req.session.curUser.type == "SAdmin") {
        //Find user
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {
                res.status(500);
                res.render('error', {
                    user: req.session.curUser,
                    message: "Database error",
                    error: err
                });
            } else if (!user) {
                res.status(404);
                res.render('error', {
                    user: req.session.curUser,
                    message: "User not found"
                });
            } else if (user.type == "SAdmin") {
                //Super admin can't demote self (I guess?)
                res.status(400);
                res.render('profile', {
                    user: req.session.curUser,
                    profUser: req.session.curUser,
                    errorMsg: "Silly Super Admin, you can't demote yourself!"
                });
            } else {
                //Demote and save
                user.type = "User";
                util.saveModel(user, function (error) {
                    res.status(500);
                    res.render('profile', {
                        user: req.session.curUser,
                        profUser: user,
                        errorMsg: "Database error."
                    });
                }, function (user) {
                    req.session.curUser = user;
                    res.render('profile', {
                        user: req.session.curUser,
                        profUser: user,
                        successMsg: "User has been demoted and is no longer an Administrator."
                    });
                });

            }
        });
    } else {
        res.status(403);
        res.render('error', {
            user: req.session.curUser,
            message: "Unauthorized"
        });
    }
});

//Delete user
router.get('/delete/:id', function (req, res, next) {
    req.sanitize('id').escape();
    //Only admin+ can delete
    if (req.session.curUser.type.indexOf("Admin") >= 0) {
        //Find user (to validate before deletion)
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {
                res.status(500);
                res.render('error', {
                    user: req.session.curUser,
                    message: "Database error",
                    error: err
                });
                //Validate
            } else if (!user) {
                res.status(404);
                res.render('error', {
                    user: req.session.curUser,
                    message: "User not found"
                });
            } else if (user.type == "SAdmin") {
                //Super admin can;t be deleted by anyone (even himself)
                res.status(403);
                res.render('error', {
                    user: req.session.curUser,
                    message: "Unauthorized"
                });
            } else {
                //Delete user
                User.remove({
                    _id: user.id
                }, function (err) {
                    if (err) {
                        res.status(500);
                        res.render('error', {
                            user: req.session.curUser,
                            message: "Database error",
                            error: err
                        });
                    } else {
                        res.redirect('/');
                    }
                });
            }
        });
    } else {
        res.status(403);
        res.render('error', {
            user: req.session.curUser,
            message: "Unauthorized"
        });
    }
});

module.exports = router;