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
        http.get('http://127.0.0.1:3000/server/asdf', function(response) {
            assert.equal(response.statusCode, 530);
        });
        done();
    });
    it('/list header return 200', function(done) {
        http.get('http://127.0.0.1:3000/server/list', function(response) {
            assert.equal(response.statusCode, 200);

        });
        done();
    });
});

describe("Backend Tests on /profile/", function() {
    before(function() {
		server.listen(3000);
	});
	after(function() {
		server.close();
	});

    it('/edit should redirect to login page', function(done) {
        http.get('http://127.0.0.1:3000/profile/edit/asdf', function(response) {
            //Should be 302 since not logged in
            assert.equal(response.statusCode, 302);
            done();
        });

    });

});
