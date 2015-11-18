var express = require('express');
var User = require('../model');
var router = express.Router();



/* GET analytics page. */
router.get('/:id?', function (req, res, next) {
    if (req.session.curUser == null) {
        res.redirect('/user/login');
        return;
    }
    if (req.session.curUser.type.indexOf("Admin") < 0) {
        res.status(403);
        res.render('error', {
            user: req.session.curUser,
            message: "Unathorized"
        });
    } else {
        if (req.params.id) {

            //Find the requested user
            User.findOne({
                _id: req.params.id
            }, function (err, user) {
                if (err) {
                    console.log(err);
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
                } else {
                    //Display user data
                    res.render('analytics', {
                        user: req.session.curUser,
                        profUser: user,
                        favPages: orderFavs(user.pages, user.pageVisits)
                    });
                }
            });


        } else {
            res.render('analytics', {
                user: req.session.curUser,
                profUser: req.session.curUser,
                favPages: orderFavs(req.session.curUser.pages, req.session.curUser.pageVisits)
            });
        }
    }
});

//Simple function to merge two arrays - one of strings and one of corresponding numbers, 
//then sort them by numbers, and return the top 3 values.
function orderFavs(pages, visits) {
    var pairs = [];
    for (i = 0; i < pages.length; i++) {
        pairs.push({
            page: pages[i],
            visits: visits[i]
        });
    }
    pairs.sort(function (a, b) {
        return b.visits - a.visits
    });
    return pairs.slice(0, Math.min(3, pairs.length));
}

module.exports = router;