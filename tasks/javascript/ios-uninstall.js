/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Uninstalls an application from an iOS device.
 */

var async = require('async');
var path = require('path');

module.exports.validate = function validate () {
	return {
		context: {
			app_path: 'required',
			device_identifier: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var bundleIdentifier;

	async.series([
		function (cb) {
			if (context.app_path) {
				var service = new context.services.AppToBundleIdentifierService(context, exec);
				service.convert(context.app_path, function (error, result) {
					bundleIdentifier = result;
					cb(error);
				});
			}
			else {
				cb(new Error('App path is not defined.'));
			}
		},
		function (cb) {
			var cmd = path.join(__rootdir, 'node_modules', 'ios-deploy', 'ios-deploy');

			var args = [];
			args.push('-i');
			args.push(context.device_identifier);
			args.push('-1');
			args.push(bundleIdentifier);
			args.push('-t');
			args.push('10');
			args.push('-v');
			args.push('-9');

			exec(cmd, args, {}, cb);
		}
	], function (error) {
		callback(error, null, true);
	});
};