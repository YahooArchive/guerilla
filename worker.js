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
config = require('./lib/config');

logger.d("creating output directory");
fs.mkdirsSync(config.data_dir);

logger.d('Connecting to db...');
db.connect(config.db, function (error, db) {
	if (error) throw new Error('Failed to connect to the db. Exiting. Error:' + error);
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
