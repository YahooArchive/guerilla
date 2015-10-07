/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Task runner for bash type tasks.
 */

var fs = require('fs-extra');
var path = require('path');
var async = require('async');

module.exports.validate = function validate (params, context, callback) {
	callback(null);
};

module.exports.execute = function execute (params, context, exec, callback) {
	var file;
	var cwd;
	var actualShebang;
	var expectedShebang = '#!/bin/bash';

	if (params.task) {
		file = (params.task.slice(-5) === '.bash') ? params.task : params.task + '.bash';
		cwd = path.join(__dirname, 'bash');
	}
	else if (params.custom_task) {
		file = params.custom_task;
		var cwd = context.project_root;
		if (!cwd)
			callback(new Error('Cannot find project root.'));
	}

	async.waterfall([
		function (cb) {
			var cmd = 'head';

			var args = [];
			args.push('-1');
			args.push(file);

			var options = {
				cwd: cwd,
				stdout: function (data) {
					actualShebang = String(data).trim();
				}
			}

			exec(cmd, args, options, cb);
		},
		function (cb) {
			if (actualShebang !== expectedShebang)
				return callback(new Error('Invalid shebang. <Expected: ' + expectedShebang + '> <Actual: ' + actualShebang +'>.'));

			var cmd = 'bash';

			var args = [];
			args.push(file);
			if (param.args)
				args = args.concat(param.args);

			var options = { cwd: cwd }

			exec(cmd, args, options, cb);
		}
	], callback)
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	callback(null);
};