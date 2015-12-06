//Unit tests
var assert = require("assert");
var http = require('http');
var server = require('./server');


describe("Backend Tests on /server/", function() {
    before(function() {
		server.listen(3000);
	});
	after(function() {
		server.close();
	});

    it('/like/:server_id header return 530', function(done) {
        http.get('http://127.0.0.1:3000', function(response) {
            assert.equal(response.statusCode, 530);
        });
        done();
    });
    it('/list header return 200', function(done) {
        http.get('http://127.0.0.1:3000', function(response) {
            assert.equal(response.statusCode, 200);
        });
        done();
    });
});
