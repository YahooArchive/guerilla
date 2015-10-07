/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Launches an application on an Android device.
 */

var async = require('async');

module.exports.validate = function validate () {
	return {
		params: {
			apk_name: function (p, c) {
				if (p.package_name) return true;
				return (p.apk_name) ? true : false;
			},
			package_name: function (p, c) {
				if (p.apk_name) return true;
				return (p.package_name) ? true : false;
			}
		},
		context: {
			apk_dir: function (p, c) {
				if (!p.package_name && p.apk_name) return (c.apk_dir) ? true : false;
				return true;
			},
			device_identifier: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var packageName = params.package_name;

	async.series([
		function (cb) {
			if (packageName) return cb();
			var service = new context.services.APKToPackageNameService(context, exec);
			service.convert(context.apk_dir, params.apk_name, function (error, result) {
				packageName = result;
				cb(error);
			});
		},
		function (cb) {
			context.addPostJobTask({
				type: 'javascript',
				task: 'android-force-stop',
				package_name: packageName
			});

			var cmd = 'adb';

			var args = [];
			args.push('-s');
			args.push(context.device_identifier);
			args.push('shell');
			args.push('monkey');
			args.push('-p');
			args.push(packageName);
			args.push('-c');
			args.push('android.intent.category.LAUNCHER');
			args.push(1);

			exec(cmd, args, {}, cb);
		}
	], callback);
};