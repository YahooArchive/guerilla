/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an APK and runs a monkey test on an Android device. Outputs networks usage, memory usage and logcat.
 */

var async = require('async');
var path = require('path');
var _ = require('underscore');

module.exports.validate = function validate () {
	return {
		params: {
			apk_name: 'required',
			event_count: 'required',
			throttle: 'optional',
			seed: 'optional'
		},
		context: {
			apk_dir: 'required',
			device_identifier: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var packageName;
	var logcatService = new context.services.LogcatService(context, exec);
	var androidMemoryService = new context.services.AndroidMemoryService(context, exec);
	var androidNetworkService = new context.services.AndroidNetworkService(context, exec);

	async.series([
		function (cb) {
			context.runTask({ 
				type: 'javascript', 
				task: 'android-install',
				apk_name: params.apk_name
			}, cb);
		},
		function (cb) {
			var service = new context.services.APKToPackageNameService(context, exec);
			service.convert(context.apk_dir, params.apk_name, function (error, result) {
				packageName = result;
				cb(error);
			});
		},
		function (cb) {
			logcatService.start(function () { cb(); });
		},
		function (cb) {
			androidMemoryService.start(packageName, function () { cb(); });
		},
		function (cb) {
			androidNetworkService.start(packageName, function () { cb(); });
		},
		function (cb) {
			context.addPostJobTask({
				type: 'javascript',
				task: 'android-force-stop',
				package_name: packageName
			});

			context.addPostJobTask({
				type: 'javascript',
				task: 'android-kill-monkey'
			});

			var cmd = 'adb';

			var args = [];
			args.push('-s');
			args.push(context.device_identifier);
			args.push('shell');
			args.push('monkey');
			args.push('-p');
			args.push(packageName);
			args.push('-v');
			args.push('--kill-process-after-error');
			if (params.throttle) {
				args.push('--throttle');
				args.push(params.throttle);
			}
			if (params.seed) {
				args.push('-s');
				args.push(params.seed);
			}
			args.push(params.event_count);

			var options = { 
				file: path.join(context.output_dir, 'monkey-log.txt'), 
				log: [true, false, false, true],
			};
			
			exec(cmd, args, options, cb);
		}
	], function (error) {
		androidNetworkService.stop();
		androidMemoryService.stop();
		logcatService.stop();

		var output = _.extend(androidMemoryService.stats, androidNetworkService.stats);
		callback(error, output, true);
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	//TODO: parse monkey-log.txt
	callback(null, true);
}