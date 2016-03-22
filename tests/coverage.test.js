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
	'lib/simctl-test-data.js', 'lib/logger.js', 'lib/db.js' ];
// should simctl-test-data be moved to a tests/fixtures directory?
var SIMCTL_TEST_DATA = fs.readFileSync(
	path.join(__ROOTDIR, 'lib', 'simctl-test-data.js'),
	{encoding: 'utf-8'});

function load(filename) {
	var startAt = process.hrtime();
	require(path.join(__ROOTDIR, filename));
	var diff = process.hrtime(startAt);
	var time = diff[0] * 1e3 + diff[1] * 1e-6;
	debug(time.toFixed(3) + 'ms, fn:', filename);
}

describe('Coverage baseline', function () {
	var sandbox;
	before(function () {
		sandbox = sinon.sandbox.create();
	});
	after(function () {
		sandbox.restore();
	});
	describe('exceptions', function () {
		describe('for lib/db', function () {
			it('should load', function () {
				load('lib/db');
			});
		});
		describe('for lib/logger', function () {
			before(function () {
				mockery.enable({
					warnOnUnregistered: false,
					warnOnReplace: false,
					useCleanCache: true
				});
				mockery.registerSubstitute('yargs',
					path.join(__ROOTDIR, 'tests', 'mocks', 'yargs'));
			});
			after(function () {
				mockery.disable();
			});
			it('should load', function () {
				load('lib/logger');
			});
		});
		describe('for lib/github-client.js', function () {
			before(function () {
				mockery.enable({
					warnOnUnregistered: false,
					warnOnReplace: false,
					useCleanCache: true
				});
				var githubApiMock = function () {
					return {
						authenticate: function () {
						},
						repos: {
							getContent: function (_, cb) {
								setImmediate(cb, {
									type: 'file',
									content: 'XXX',
									encoding: 'utf-8'
								});
							}
						}
					};
				};
				mockery.registerMock('github', githubApiMock);
				mockery.registerSubstitute('./config',
					path.join(__ROOTDIR, 'tests', 'mocks', 'config'));
				load(path.join('lib', 'globals.js'));
			});
			after(function () {
				mockery.disable();
			});
			it('should load', function () {
				load('lib/github-client');
			});
		});
		describe('for lib/config.js', function () {
			before(function () {
				mockery.enable({
					warnOnUnregistered: false,
					warnOnReplace: false,
					useCleanCache: true
				});
				mockery.registerSubstitute('./logger',
					path.join(__ROOTDIR, 'tests', 'mocks', 'logger'));
				var configFilePath =
					path.join(__ROOTDIR, 'tests', 'fixtures', 'config.json');
				var yargsMock = {
					argv: {
						config: configFilePath,
						master: true
					},
					boolean: function() {
						return yargsMock;
					},
					default: function () {
						return yargsMock;
					},
					usage: function () {
						return yargsMock;
					}
				};
				mockery.registerMock('yargs', yargsMock);
				load(path.join('lib', 'globals.js'));
			});
			after(function () {
				mockery.disable();
			});
			it('should load', function () {
				load('lib/config');
			});
		});
	});
	describe('with mocks', function () {
		before(function () {
			mockery.enable({
				warnOnUnregistered: false,
				warnOnReplace: false,
				useCleanCache: true
			});
			mockery.registerSubstitute('./logger',
				path.join(__ROOTDIR, 'tests', 'mocks', 'logger'));
			mockery.registerSubstitute('./lib/logger',
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
				.returns(SIMCTL_TEST_DATA);
		});
		afterEach(function () {
			sandbox.restore();
		});
		it('should load globals.js first', function () {
			load(path.join('lib', 'globals.js'));
		});
		// split up the directories, because it is taking too long
		function loadSourceFiles(srcDir) {
			it('should load all source files under ' + srcDir, function (done) {
				glob(srcDir + '/*.js', function (err, files) {
					files.forEach(function (filename) {
						if (~EXCLUDE.indexOf(filename)) {
							debug('skipping:', filename);
							return;
						}
						load(filename);
					});
					setImmediate(done);
				});
			});
		}
		SRC_DIRS.forEach(loadSourceFiles);
	});
});
