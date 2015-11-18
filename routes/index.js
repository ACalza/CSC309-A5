var express = require('express');
var User = require('../model');
var router = express.Router();



/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.session.curUser) {

        //List all users
        User.find({}, function (err, users) {
            res.render('index', {
                user: req.session.curUser,
                allUsers: users
            });
        });
    } else {
        res.render('index');
    }
});

module.exports = router;
