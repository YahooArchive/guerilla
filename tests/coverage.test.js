'use strict';

// the entire, and only, point of this test suite is to require every source
// file so a coverage baseline can be established.

var mockery = require('mockery');
var debug = require('debug')('coverage.test');
var sinon = require('sinon');
var path = require('path');
var glob = require('glob');
var fs = require('fs');

var __ROOTDIR = path.join(__dirname, '..');
var SRC_DIRS = [ 'routes/master', 'routes/worker', 'services', 'models',
	'tasks', 'lib', '.' ];
var EXCLUDE = [ 'lib/config.js', 'lib/github-client.js', 
	'lib/simctl-test-data.js', 'lib/logger.js' ];
// should simctl-test-data be moved to a tests/fixtures directory?
var SIMCTL_TEST_DATA = fs.readFileSync(
	path.join(__ROOTDIR, 'lib', 'simctl-test-data.js'),
	{encoding: 'utf-8'});

function req(filename) {
	var startAt = process.hrtime();
	require(path.join(__ROOTDIR, filename));
	var diff = process.hrtime(startAt);
	var time = diff[0] * 1e3 + diff[1] * 1e-6;
	debug(time.toFixed(3) + 'ms, fn:', filename);
}

function getSimctlData() {
	return SIMCTL_TEST_DATA;
}

describe('Coverage baseline', function () {
	var sandbox;
	before(function () {
		sandbox = sinon.sandbox.create();
	});
	after(function () {
		sandbox.restore();
	});
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
	beforeEach(function () {
		var childProcess = require('child_process');
		sandbox.stub(childProcess, 'execSync')
			.withArgs('xcrun simctl list')
			.returns(getSimctlData());
	});
	afterEach(function () {
		sandbox.restore();
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
