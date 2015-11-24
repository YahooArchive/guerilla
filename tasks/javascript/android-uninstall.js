/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Uninstalls an application from an Android device.
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
			device: 'required'
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
			var cmd = 'adb';

			var args = [];
			args.push('-s');
			args.push(context.device.identifier);
			args.push('shell');
			args.push('pm');
			args.push('uninstall');
			args.push(packageName);

			exec(cmd, args, {}, cb);
		}
	], function (error) {
		callback(error, null, true);
	});
};