'use strict';

// the entire, and only, point of this test suite is to require every source
// file so a coverage baseline can be established.

var mockery = require('mockery');
var debug = require('debug')('coverage.test');
var async = require('async');
var path = require('path');
var glob = require('glob');

var __ROOTDIR = path.join(__dirname, '..');
var SRC_DIRS = [ 'routes/master', 'routes/worker', 'services', 'models',
	'tasks', 'lib', '.' ];
var EXCLUDE = [ 'lib/config.js', 'lib/github-client.js', 
	'lib/simctl-test-data.js', 'lib/logger.js' ];

function req(filename) {
	var startAt = process.hrtime();
	require(path.join(__ROOTDIR, filename));
	var diff = process.hrtime(startAt);
	var time = diff[0] * 1e3 + diff[1] * 1e-6;
	debug(time.toFixed(3) + 'ms, fn:', filename);
}

describe('Coverage baseline', function () {
	before(function () {
		mockery.enable({
			warnOnUnregistered: false
		});
		mockery.registerSubstitute('./logger',
			path.join(__ROOTDIR, 'tests', 'mocks', 'logger'));
		mockery.registerSubstitute('git-rev',
			path.join(__ROOTDIR, 'tests', 'mocks', 'git-rev'));
		mockery.registerSubstitute('fs-extra',
			path.join(__ROOTDIR, 'tests', 'mocks', 'fs-extra'));
		mockery.registerSubstitute('yargs',
			path.join(__ROOTDIR, 'tests', 'mocks', 'yargs'));
		// handle all the "config" variants
		mockery.registerSubstitute('./lib/config',
			path.join(__ROOTDIR, 'tests', 'mocks', 'config'));
		mockery.registerSubstitute('./config',
			path.join(__ROOTDIR, 'tests', 'mocks', 'config'));
		mockery.registerSubstitute(path.join(__ROOTDIR, 'lib', 'config'),
			path.join(__ROOTDIR, 'tests', 'mocks', 'config'));
		// handle all the "db" variants
		mockery.registerSubstitute('./lib/db',
			path.join(__ROOTDIR, 'tests', 'mocks', 'db'));
		mockery.registerSubstitute('./db',
			path.join(__ROOTDIR, 'tests', 'mocks', 'db'));
		mockery.registerSubstitute(path.join(__ROOTDIR, 'lib', 'db'),
			path.join(__ROOTDIR, 'tests', 'mocks', 'db'));
	});
	after(function () {
		mockery.disable();
	});
	it('should require globals.js first', function () {
		req(path.join('lib', 'globals.js'));
	});
	// split up the directories, because it is taking too long
	SRC_DIRS.forEach(function (srcDir) {
		it('should require all source files under ' + srcDir, function (done) {
			glob(srcDir + '/*.js', function (err, files) {
				files.forEach(function (filename) {
					if (~EXCLUDE.indexOf(filename)) {
						debug('skipping:', filename);
						return;
					}
					req(filename);
				});
				setImmediate(done);
			});
		});
	});
});
