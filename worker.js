/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Starts up the worker server.
 */

var fs = require('fs-extra');
var http = require('http');

var db = require('./lib/db');
var config;

logger.d('Guerilla worker is starting up...')


logger.d('Validating config/worker/config.json...');
try { config = require('./lib/config'); }
catch (ex) { return logger.e(ex.message); }

fs.mkdirs(config.data_dir, function (error) {
	if (error) return logger.e('Failed to create the Guerilla directory. Exiting.');

	logger.d('Connecting to db...');
	db.connect(config.db, function (error, db) {
		if (error) return logger.e('Failed to connect to the db. Exiting.');
		logger.d('Connected to db...');
		
		logger.d('Initializing queue...');
		require('./lib/queue').init(function () {
			logger.d('Initialized queue...');
			logger.d('Creating app...');
			var app = require('./lib/app');
			logger.d('Created app...');
			logger.d('Creating server...');
			http.createServer(app).listen(config.port, function () {
				logger.d('Created server...');
				logger.i('Guerilla worker is ready.');
			});
		});
	});
});