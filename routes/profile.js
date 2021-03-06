var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var User = require("../models/user");
var util = require('../util');
var error503 = 'Status 503 server error';

/* GET profile page */
router.get('/', function (req, res, next) {
    if (req.session.curUser == null) {
        res.redirect('/auth/local/login');
        return;
    }
    // Current user's profile, get user from session
    res.render('profile', {
        user: req.session.curUser,
        profUser: req.session.curUser
    });
});

// GET View a profile
router.get("/view/:id", function (req, res, next) {
    //Must be logged in to view profiles
    if (req.session.curUser == null) {
        res.redirect('/user/login');
        return;
    }
    req.sanitize('id').escape();
    //If this is our own id, redirect to index
    if (req.params.id == req.session.curUser._id) {
        res.redirect('/profile/');
    } else {

        //Not current user, so find them
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {

                console.error(err);
                res.status(503)
                res.render('error', {
                    message: err503
                });
            } else if (!user) {
                res.status(404);
                res.render('error', {
                    user: req.session.curUser,
                    message: "User not found",
                });

            } else {
                //Render user's profile
                res.render('profile', {
                    user: req.session.curUser,
                    profUser: user
                });
            }

        });
    }
});


/* GET profile edit page */
router.get('/edit/:id/:command?', function (req, res, next) {
    if (req.session.curUser == null) {
        return res.redirect('/auth/local/login');
    }
    req.sanitize('id').escape();
    req.sanitize('command').escape();
    if (req.session.curUser.type.indexOf("Admin") >= 0 || req.session.curUser._id == req.params.id) {
        //May or may not be our own id, we are agnostic
        User.findOne({
            _id: req.params.id
        }, function (err, user) {
            if (err) {
                res.status(500);
                res.render("error", {
                    message: "Database error",
                    error: err
                });
            } else if (!user) {
                res.status(404);
                res.render("error", {
                    message: "User not found"
                });
            } else if (user.accountSource != "Local") {
                res.render('profile', {
                    edit: false,
                    profUser: user,
                    user: req.session.curUser,
                    errorMsg: "You can't edit the details of your " + user.accountSource + " account here."
                });

            } else {
                //Show editable version.
                //View will take care of allowing password changes (but we double check in the post function JIC)
                res.render('profile', {
                    user: req.session.curUser,
                    edit: true,
                    profUser: user
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

//TODO: Disable editing on non local accounts.
/* POST profile edit page */
router.post('/edit/:id/:command?', function (req, res, next) {
    if (req.session.curUser == null) {
        return res.redirect('/auth/local/login');
    }
    req.sanitize('id').escape();
    req.sanitize('command').escape();
    req.sanitize('displayName').escape();
    req.sanitize('description').escape();
    req.sanitize('newpassword').escape(); //Gets hashed but just in case
    req.sanitize('confirmpassword').escape();
    //Only admin or owner can edit
    if (req.session.curUser.type.indexOf("Admin") >= 0 || req.session.curUser._id == req.params.id) {
        //No command, editing general properties
        if (!req.params.command) {

            //Find the user (maybe owner maybe not)
            User.findOne({
                _id: req.params.id
            }, function (err, user) {
                if (err) {
                    res.status(500);
                    res.render("error", {
                        message: "Database error",
                        error: err
                    });
                } else if (!user) {
                    res.status(404);
                    res.render("error", {
                        message: "User not found"
                    });
                } else if (user.accountSource != "Local") {
                    res.render('profile', {
                        edit: false,
                        profUser: user,
                        user: req.session.curUser,
                        errorMsg: "You can't edit the details of your " + user.accountSource + " account here."
                    });
                } else {
                    // No display name? Set to email
                    if (!req.body.displayName || req.body.displayName.length == 0) {
                        req.body.displayName = user.email;
                    }
                    user.displayName = req.body.displayName;
                    user.description = req.body.description;

                    //Save
                    util.saveModel(user, function (error) {

                        res.render('profile', {
                            edit: true,
                            profUser: user,
                            user: req.session.curUser,
                            errorMsg: "Database error"
                        });
                    }, function (user) {
                        // No longer edit mode, but persist displayed user
                        // Ideally would redirect back to view, but don't want to pass
                        // (success) message as param
                        req.session.curUser = user;
                        res.render('profile', {
                            profUser: user,
                            user: req.session.curUser,
                            successMsg: "Your changes have been saved"
                        });
                    });
                }

            });
            // Post from change password form
        } else if (req.params.command == "changepw") {

            //Only owner can change password (Admin would not know old password)
            if (req.params.id != req.session.curUser._id) {
                res.status(403);
                res.render('error', {
                    user: req.session.curUser,
                    message: "Unauthorized"
                });
            } else {
                //Validation (having it on server gives more security since client page can be
                // tampered with to skip validation. Also don't need to send password (even in hashed form) to client)
                if (util.md5hash(req.body.oldpassword) != req.session.curUser.password) {
                    res.render('profile', {
                        profUser: req.session.curUser,
                        user: req.session.curUser,
                        edit: true,
                        errorChangePWMsg: "Old password was incorrect"
                    });

                } else if (req.body.newpassword != req.body.confpassword) {
                    res.render('profile', {
                        profUser: req.session.curUser,
                        user: req.session.curUser,
                        edit: true,
                        errorChangePWMsg: "Passwords did not match"
                    });
                } else {
                    //Password change/fields valid
                    User.findOne({
                        _id: req.params.id
                    }, function (err, user) {
                        if (err) {
                            res.render('profile', {
                                profUser: req.session.curUser,
                                user: req.session.curUser,
                                edit: true,
                                errorChangePWMsg: "Database error"
                            });
                            //User is session user, so we should not be worried about not finding them
                        } else {
                            //Change password and save
                            user.password = util.md5hash(req.body.newpassword);
                            util.saveModel(user, function (err) {
                                res.render('profile', {
                                    profUser: user,
                                    user: req.session.curUser,
                                    edit: true,
                                    errorChangePWMsg: "Database error"
                                });

                            }, function (user) {
                                req.session.curUser = user;
                                res.render('profile', {
                                    profUser: user,
                                    user: req.session.curUser,
                                    edit: true,
                                    successChangePWMsg: "Your password has been changed"
                                });
                            });

                        }
                    });
                }

            }
            //Unknown command
        } else {
            res.redirect("/profile/");
        }
        //Not admin or owner
    } else {
        res.status(403);
        res.render('error', {
            user: req.session.curUser,
            message: "Unauthorized"
        });
    }




});

module.exports = router;