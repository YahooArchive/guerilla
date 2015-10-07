/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Runs XCTests on an iOS device.
 */

var path = require('path');
var async = require('async');
var fs = require('fs-extra');
var plist = require('plist');

module.exports.execute = function execute (params, context, exec, callback) {
	var output = {};
	var resultsFile;
	var errors = [];

	async.series([
		function (cb) {
			context.addPostJobTask({
				type: 'javascript',
				task: 'ios-uninstall'
			});

			var p = {}
			for (var key in params) {
				p[key] = params[key];
			}

			p.task = 'xcrun';
			p.build_actions = ['test'];

			context.runTask(p, function (error) {
				if (error) errors.push(error);
				cb();
			});
		},
		function (cb) {
			var service = new context.services.FinderService(context, exec);
			service.find('results.plist', context.build_dir, { unique: true }, function (error, result) {
				resultsFile = result;
				cb(error);
			});
		},
		function (cb) {
			var cmd = 'cp';

			var args = [];
			args.push(resultsFile);
			args.push(context.output_dir);

			exec(cmd, args, {}, cb);
		},
		function (cb) {
			fs.readFile(resultsFile, 'utf8', function (error, file) {
				if (error) return cb('Could not find/read results.plist');

				output = parseResults(file);
				if (output.tests_ran !== output.tests_passed)
					error = new Error('Tests failed: ' + output.tests_passed + '/' + output.tests_ran);

				cb(error);
			});
		}
	], function (error) {
		if (error) errors.push(error);
		callback((errors.length > 0) ? errors : null, output)
	});
};

function parseResults (file) {
	var testResults = plist.parse(file, 'utf8');
	var tests = testResults['Results'][0]['Testable Tests'];

	var result = {
		tests_passed: 0,
		tests_ran: tests.length
	};

	tests.forEach(function (test) {
		if (test['Test Result'] === 'Succeeded')
			result.tests_passed++;
	});

	return result;
}