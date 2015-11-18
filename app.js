var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var util = require('./util');


var app = express();
var mongoose = require('mongoose');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(session({
    secret: "secretiohcensecretniye",
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

//=================MY MODULES
var routes = require('./routes/index');
var profile = require('./routes/profile');
var user = require('./routes/user')
var analytics = require('./routes/analytics')
app.use(function (req, res, next) {
    //Analytics hook for tracking user activity.
    if (req.session.curUser) {
        //Verify that the user has not been deleted
        util.moreThanZero({
            _id: req.session.curUser._id
        }, function (err) {
            res.status(500);
            res.render('error', {
                message: err.message,
                error: err
            });
        }, function () {
            req.session.curUser = null;
            next();
        }, function () {
            var indexOfPage = req.session.curUser.pages.indexOf(req.path);
            if (indexOfPage < 0) {
                req.session.curUser.pages.push(req.path);
                req.session.curUser.pageVisits.push(1);
            } else {
                req.session.curUser.pageVisits[indexOfPage] = req.session.curUser.pageVisits[indexOfPage] + 1;
            }

            util.saveModel(req.session.curUser, function (err) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
                console.log(err);
            }, function (user) {
                next();
            });
        });
    } else {
        next();
    }

});

app.use('/', routes);
app.use('/profile', profile);
app.use('/user', user);
app.use('/analytics', analytics);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;