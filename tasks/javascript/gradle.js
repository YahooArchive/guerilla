/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Runs Gradle.
 */

var path = require('path');
var async = require('async');

module.exports.validate = function validate () {
	return {
		params: {
			gradle_tasks: function (p, c) {
				if (!p.gradle_tasks) return false;
				if (!Array.isArray(p.gradle_tasks)) return false;
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
			var cmd = './gradlew';

			var args = [];
			if (params.build_file) {
				args.push('--build-file');
				args.push(params.build_file);
			}
			args.push('--info');
			args.push('--stacktrace');
			args.push('-Dsdk.dir=${ANDROID_HOME}');
			params.gradle_tasks.forEach(function (gradle_task) {
				args.push(gradle_task);
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