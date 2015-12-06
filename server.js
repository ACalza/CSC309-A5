#!/usr/bin/env node

/**
 * Module dependencies.
 */
var models = require("./models/index");
var routes = require("./routes/index");
var app = require('./app');
var debug = require('debug')('a4:server');
var http = require('http');
var mongoose = require("mongoose");
var minecraftUpdater = require("./lib/server-updater")

/**
 * Connect to mongoose server
 */
mongoose.connect('mongodb://ourgroup:password@ds061464.mongolab.com:61464/csc309', {
    user: 'ourgroup',
    pass: 'password'
});

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

//Update minecraft server info every 5 minutes
function doUpdate() {


    setTimeout(function () {
        minecraftUpdater.updateAllServers(function () {
            doUpdate();
        });
    }, 1000 * 60 * 5); //millis * seconds (millis = 1000) * minutes (seconds = 60)
}

minecraftUpdater.updateAllServers(function () {
    doUpdate();
});
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = server;
