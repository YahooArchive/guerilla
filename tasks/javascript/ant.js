/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Runs Ant.
 */

var path = require('path');
var async = require('async');

module.exports.validate = function validate () {
	return {
		params: {
			ant_targets: function (p, c) {
				if (!p.ant_targets) return false;
				if (!Array.isArray(p.ant_targets)) return false;
				return true;
			},
			build_file: 'optional'
		},
		context: {
			project_root: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	async.series([
		function (cb) {
			var cmd = 'ant';

			var args = [];
			if (params.build_file) {
				args.push('-f');
				args.push(params.build_file);
			}
			args.push('-Dsdk.dir=${ANDROID_HOME}');
			params.ant_targets.forEach(function (target) {
				args.push(target);
			});

			var options = { cwd: context.project_root }

			exec(cmd, args, options, cb);
		},
		function (cb) {
			var service = new context.services.FinderService(context, exec);
			var options = { format: 'parent', unique: true };
			service.find('*.apk', context.project_root, options, function (error, result) {
				context.apk_dir = result;
				cb(error);
			});
		}
	], callback);
};
