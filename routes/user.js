var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var User = require('../model');
var util = require('../util');
var uaparse = require('ua-parser-js');

/* GET login */
router.get('/login', function (req, res, next) {
    //Logged in users can't access
    if (req.session.curUser != null) {
        res.redirect('/profile');
        return;
    }
    res.render('login');
});

/* POST Login */
router.post('/login', function (req, res, next) {
    //Logged in users can't access
    if (req.session.curUser != null) {
        res.redirect('/profile');
        return;
    }
    var email = req.body.email;
    var pass = req.body.password;
    var loc = req.body.location;
    pass = util.md5hash(pass);
    User.findOne({
        email: email,
        password: pass
    }, function (err, user) {
        if (user) {
            //Match - set session user to matched

            //Log login analytics
            user.loginDates.push(new Date().toDateString())
            user.loginIPs.push(req.ip);

            var ua = uaparse(req.headers['user-agent']);
            var device = ua.device;

            var devString = (device.type ? device.type : "Desktop") + "/" + (device.vendor ? device.vendor : ua.os.name + " " + ua.os.version) + "/" + (device.vendor ? device.vendor : (device.model ? device.model : "Unknown Model"));
            user.loginDevices.push(devString);
            user.loginLocations.push(loc);
            util.saveModel(user, function (err) {
                res.status(500);
                res.render('error', {
                    error: err,
                    message: "Database Error"
                });
            }, function (user) {
                req.session.curUser = user;
                res.redirect("/profile/");
            });
        } else {
            //No match - wrong email or password
            res.render('login', {
                errorMsg: "Sorry, wrong email/password."
            });
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
    //Read form fields
    var email = req.body.email.trim();
    var pass = req.body.password.trim();
    var cpass = req.body.confirmPassword.trim();
    var displayName = req.body.displayName.trim();
    var description = req.body.description.trim();

    //Validation (server side so document can't be altered to skip it)
    if (!email || email.length == 0) {
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
        res.render('register', {
            errorMsg: "Database error. Please try again later.",
            fieldStates: req.body
        });
    }, function () {
        //Email not registered
        //Further validation
        if (pass != cpass) {
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
            password: util.md5hash(pass),
            type: "User",
            img: "http://gravatar.com/avatar/" + util.md5hash(email),
            description: description
        });

        //Check to see if there is more than one user
        util.moreThanZero({
            //type: "SAdmin"
        }, function () {
            res.render('register', {
                errorMsg: "Database error. Please try again later.",
                fieldStates: req.body
            });
        }, function () {
            //There must always be at least one super admin (SAdmin), so make one if none exist
            u.type = "SAdmin";

            //Save new user
            util.saveModel(u, function (error) {
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

// Utility function for wiping database.
router.get('/wipe/', function (req, res, next) {
    User.remove({},
        function (err) {
            if (err)
                console.error(err);
            else
                console.log("Wiped users");
        });
    res.redirect('/');

});

// Make a user into an Admin
router.get('/promote/:id', function (req, res, next) {
    //Only super admin can promote
    if (req.session.curUser.type == "SAdmin") {
        //Find the user
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {
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
                res.render('profile', {
                    user: req.session.curUser,
                    profUser: req.session.curUser,
                    errorMsg: "Silly Super Admin, you can't demote yourself!"
                });
            } else {
                //Demote and save
                user.type = "User";
                util.saveModel(user, function (error) {
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