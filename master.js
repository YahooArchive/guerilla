/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Starts up the master server.
 */

var http = require('http');
var db = require('./lib/db');
var config;

logger.d('Guerilla master is starting up...');

logger.d('Validating config/master/config.json...');
try { config = require('./lib/config'); }
catch (ex) { return logger.e(ex.message); }

logger.d('Connecting to db...');
db.connect(config.db, function (error, db) {
	if (error) return logger.e('Failed to connect to the db. Exiting.');
	logger.d('Connected to db...');
	logger.d('Initializing queue...');
	require('./lib/queue').init(function () {
		logger.d('Initialized queue...');
		logger.d('Initializing scheduler...');
		require('./lib/scheduler').init(function () {
			logger.d('Initialized scheduler...');
		});
		logger.d('Creating app...');
		var app = require('./lib/app');
		logger.d('Created app...');
		logger.d('Creating server...');
		http.createServer(app).listen(config.port, function () {
			logger.d('Created server...');
			logger.i('Guerilla master is ready.');
		});
	});
});
