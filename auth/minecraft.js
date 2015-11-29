var request = require('request');

var clientToken = "4d4ba7f6-dd1c-4da6-b2d6-4913ba46740f";

var minecraft = function (router, authCompletedCallback) {
    router.get('/minecraft/login', function (req, res, next) {
        if (req.session.curUser != null) {
            authCompleteCallback(req.session.curUser, req, res, next);
            return;
        }
        res.render('mclogin');
    });
    router.post('/minecraft/login', function (req, res, next) {
        //Logged in users can't access
        if (req.session.curUser != null) {
            res.redirect('/profile');
            return;
        }
        var email = req.body.email;
        var pass = req.body.password;
        yggdrasilAuthenticate(email, pass, function (resp) {
            authCompletedCallback({
                email: email,
                picture: "https://minotar.net/bust/" + resp.selectedProfile.name + "/100.png",
                name: resp.selectedProfile.name,
                access_token: resp.access_token
            }, req, res, next);
        }, function (resp, err) {
            console.log(err);
            res.render('mclogin', {
                errorMsg: err.errorMessage
            });
        }, function (err) {
            res.render('mclogin', {
                errorMsg: "An error occurred contacting the Mojang Servers."
            });
        });
    });
};

function yggdrasilAuthenticate(email, password, successCallback, invalidCallCallback, errorCallback) {
    request.post('https://authserver.mojang.com/authenticate', {
        json: {
            agent: {
                name: "Minecraft",
                version: 1.9
            },
            username: email,
            password: password,
            clientToken: clientToken
        }
    }, function (error, response, body) {
        if (error) {
            errorCallback(error);
        } else if (response.statusCode != 200) {
            invalidCallCallback(response, body);
        } else {
            successCallback(body);
        }
    });
}

module.exports = minecraft;