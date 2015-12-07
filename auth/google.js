var googleapis = require('googleapis');
var OAuth2Client = googleapis.auth.OAuth2;
var oauth2api = googleapis.oauth2("v2");

var CLIENT_ID = "17988975914-scs97inbdpksm5ivb4mrqeovfooa847j.apps.googleusercontent.com";
var CLIENT_SECRET = "wvL5DlJWpM8Ox4Zl80xet00L";
var REDIRECT_URL = "http://infinite-cove-8574.herokuapp.com/auth/google/authcallback";

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
});

var google = function (router, authCompleteCallback) {
    router.get('/google/login', function (req, res, next) {
        res.redirect(url);
    });

    router.get('/google/authcallback', function (req, res, next) {
        var code = req.query.code;
        oauth2Client.getToken(code, function (err, tokens) {
            // Now tokens contains an access_token and an optional refresh_token. Save them.
            if (!err) {
                oauth2Client.setCredentials(tokens);
                oauth2api.userinfo.get({
                    auth: oauth2Client
                }, function (err, response) {
                    if (err) {
                        console.log(err);
                        return null;
                    }
                    response.access_token = tokens.access_token;
                    authCompleteCallback(response, req, res, next);
                });
            } else {
                console.log(err);
            }
        });
    });
}

module.exports = google;