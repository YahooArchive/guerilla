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
		}
	], function (error) {
		if (error) errors.push(error);
		callback((errors.length > 0) ? errors : null, output)
	});
};
