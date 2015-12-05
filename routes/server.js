var express = require('express');
var router = express.Router();
var ServerDB = require('../models/index').MineCraftServer;
var Comment = require('../models/index').Comment;
var User = require('../models/user');

var serverQuery = require("../lib/server-updater.js");

//create server
router.post('/create', function(req, res) {
    if (!req.body.ip) {
        res.render('createServer', {
            error: 'Please enter an IP'
        });
    }
    if (!req.body.port) {
        req.body.port = 25565;
    }
    ServerDB.count({
        ip: req.body.ip,
        port: req.body.port
    }, function(err, result) {
        console.log(req.body.ip + ":" + req.body.port + " = " + result);
        if (err) {
            console.error(err);
            return res.send("500 Internal Server Error");
        }
        if (result != 0) {
            res.render('createServer', {
                error: 'This server is already registered'
            });
        } else {
            create_server(req, res, {
                ip: req.body.ip,
                port: req.body.port
            });
        }
    });
});


function create_server(req, res, server) {
    var newServer = new ServerDB({
        ip: server.ip,
        port: server.port
    });
    newServer.save(function(err, newServer) {
        if (err) {
            res.status(500);
            res.render('error', {
                message: "Database error",
                error: err
            });
        } else {
            serverQuery.updateOneServerModel(newServer, function(err, model) {
                if (err) {
                    res.render('createServer', {
                        error: 'Error occured communicating with the server. Please make sure it is online. Error was ' + err
                    });
                }
                console.log(model);
                res.send("OK"); //TODO: Redirect to server view
            });
        }
    });
}

router.get('/list', function(req, res, next) {
    ServerDB.find({}, function(err, result) {
        if (err) {
            console.error(err);
            return res.send("500 Internal Server Error");
        } else {
            res.render('servers', {
                user: req.session.curUser,
                servers: result
            });
        }
    });
});

router.get('/comment/list/:server_id', function(req, res, next) {
    if (!req.params.server_id || !req.body.text) {
        res.json({
            error: "Server id empty"
        });
        return;
    }
    ServerDB.findOne({
        _id: req.params.server_id //TODO: Invalid server_id might cause crash if not proper format
    }, function(err, server) {
        if (err) {
            res.status(503);
            res.json({
                error: "Database error - " + err
            });
        } else if (server == 0) {
            res.json({
                error: "Server id not found"
            });
        } else {
            Comment.find({
                server: server._id
            }, function(err, comments) {
                res.json(comments);
            });
        }
    });
});

router.get('/like/:server_id', function(req, res) {
    if (!req.session.curUser) {
        return res.json({
            error: "Not logged in"
        });
    }
    ServerDB.findById(req.params.server_id, function(err, server) {
        if (err) {
            res.status(503);
            res.json({
                error: "Database error - " + err
            });
        } else if (!server) {
            res.json({
                error: "Server ID not found"
            })
        } else {

            User.findById(req.session.curUser._id, function(err, userModel) {

                userModel.likes.push(req.params.server_id);
                userModel.save(function(err, user) {
                    if (err) {
                        res.status(503);
                        console.error(err);
                        return res.json({
                            error: "Database error - " + err
                        })
                    }
                    server.likes.push(userModel._id);
                    server.save(function(err, serverModel) {
                        if (err) {
                            console.log("I shouldnt be here");
                            res.status(503);
                            console.error(err);
                            return res.json({
                                error: "Database error - " + err
                            });
                        }
                        //Update curUser
                        req.session.curUser = userModel;
                        console.log("User " + req.session.curUser.displayName + " liked server " + req.params.server_id);
                        res.send("User " + req.session.curUser.displayName + " liked server " + req.params.server_id);
                    })

                })
            })

        }
    })
})

router.use('/recomendations', function(req, res, next) {
        ServerDB.find({}, function(err, servers) {
            if (err) {
                res.status(503);
                console.error(err);
                return res.json({
                    error: "Database error - " + err
                });
            }
            req.body.servers = servers;
            next();
        })
    })
    //TODO change to post request?
router.get('/recomendations', function(req, res) {
    if (!req.session.curUser) {
        return res.json({
            error: "Not logged in"
        })
    }

    var maxRecomendations = req.body.maxRecomendations
    if (maxRecomendations) {
        maxRecomendations = req.session.curUser.likes.length;
    }
    req.body.possibleServers = {}
    //Current user likes (to be added as a new String, JS is acting strange)
    req.body.likes = []
    recomendationRecursion(0, maxRecomendations, req, res);


})

function filterAndSort(req, res){
    var serverRecomendations = [];
    //Classic n^2 algoirthm
    for(server in req.body.possibleServers){
        var max = req.body.possibleServers[server];

        for(possibleMax in req.body.possibleServers){
            if(req.body.possibleServers[possibleMax] > max){
                max = req.body.possibleServers[possibleMax];
            }
        }
        serverRecomendations.push(serverRecomendations);
    }


    return res.send(req.body.possibleServers);
}
function recomendationRecursion(index, maxRecomendations, req, res) {
    var curUser = req.session.curUser;

    if (curUser.likes.length === index || index === maxRecomendations) {
        filterAndSort(req, res);
    } else {
        ServerDB.findById(curUser.likes[index], function(err, server) {
            if (err) {
                res.status(503);
                return res.json({
                    error: "Database error - " + err
                });
            };

            //go through each server MCQuery issues so ; for nodemon D:
            for (var i = 0; i < req.body.servers.length; i++) {
                console.log(req.body.servers[i]._id);
                var rank = 0;
                if(curUser.likes.indexOf(new String(req.body.servers[i]._id).valueOf()) !== -1) {
                    console.log("here");
                    continue;

                };

                req.body.servers[i].plugins.forEach(function(plugin) {

                    if (server.plugins.indexOf(plugin) !== -1) {
                        rank += 1;
                    }
                });

                if (server.numPlayersOnline >= req.body.servers[i].numPlayersOnline - 20
                    && server.numPlayersOnline <= req.body.servers[i].numPlayersOnline + 20) {

                    rank += 10; //Within range, we give it a greater score
                } else if (server.numPlayersOnline >= req.body.servers[i].numPlayersOnline - 20) {
                    rank += 1; //otherwise add 1 to the value
                }
                if (server.maxPlayers >= req.body.servers[i].maxPlayers - 50 && server.maxPlayers <= req.body.servers[i].maxPlayers + 50) {
                    rank += 10; //Within range, we give it a greater score
                } else if (server.maxPlayers >= req.body.servers[i].maxPlayers - 50) {
                    rank += 1; //otherwise add 1 to the value
                };

                if(req.body.possibleServers[req.body.servers[i]._id]){
                    req.body.possibleServers[req.body.servers[i]._id]["rank"] += rank;
                }else{
                    req.body.possibleServers[req.body.servers[i]._id] = {
                            "rank": rank,
                            "server": server
                    };
                }
                //I'm getting weird bugs if I dont add ; "challenge token" from mcquery crashes
            }

            recomendationRecursion(index + 1, maxRecomendations, req, res);
        })
    }
}
//TODO: Move to router?
router.post('/comment/add/:server_id', function(req, res, next) {
    if (!req.session.curUser) {
        res.json({
            error: "Not logged in"
        });
        return;
    }
    if (!req.params.server_id || !req.body.text) {
        res.json({
            error: "Server or text empty"
        });
        return;
    }
    ServerDB.findOne({
        _id: req.params.server_id //TODO: Invalid server_id might cause crash if not proper format
    }, function(err, server) {
        if (err) {
            res.json({
                error: "Database error - " + err
            });
        } else if (server == 0) {
            res.json({
                error: "Server id not found"
            });
        } else {
            var comment = new Comment({
                poster: req.session.curUser._id,
                server: server._id,
                text: req.body.text,
                verified: req.session.curUser.accountSource == "Minecraft" && server.playerHistory.indexOf(req.session.curUser.displayName) >= 0
            });
            comment.save(function(err) {
                if (err) {
                    res.json({
                        error: "Server id not found"
                    });
                } else {
                    res.send("OK");
                }
            });
        }
    });

});

router.get('/:ip', function(req, res) {
    ServerDB.find({
        ip: req.params.ip
    }, function(err, result) {
        if (err) {
            console.log(err);
            return res.send('500 Internal Server Error');
        } else {
            var i;
            for (i = 0; i < result.length; i++) {
                if (String(result[i].port) == "25565") {
                    res.render('server', {
                        user: req.session.curUser,
                        server: result[i]
                    });
                } else {
                    return res.send('Server does not exist');
                }
            }
        }
    });

});


router.get('/:ip/:port', function(req, res) {
    var ip = req.params.ip
    var port = req.params.port
    ServerDB.find({
        ip: ip
    }, function(err, result) {
        if (err) {
            console.log(err);
            return res.send('500 Internal Server Error');
        } else {
            var i;
            for (i = 0; i < result.length; i++) {
                if (String(result[i].port) == port) {
                    res.render('server', {
                        user: req.session.curUser,
                        server: result[i]
                    });
                } else {
                    return res.send('Server does not exist');
                }
            }
        }
    });

});

module.exports = router;
