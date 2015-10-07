/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Calculates the size of an APK.
 */

var async = require('async');

module.exports.validate = function validate () {
	return {
		params: {
			apk_name: 'required'
		},
		context: {
			apk_dir: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var cmd = 'sh';

	var args = [];
	args.push('-c');
	args.push('du -h "' + params.apk_name + '" | cut -f1');

	var size;
	function stdout (data) {
		size = data.trim();
	}

	var options = { stdout: stdout, cwd: context.apk_dir };

	exec(cmd, args, options, function (error) {
		if (error) return callback(error);
		if (!size) return callback(new Error('Failed to get size of: ' + params.apk_name));

		var unit = size.slice(-1);
		size = size.slice(0, -1);

		//convert to megabytes
		if (unit === 'B') size /= 1000000;
		else if (unit === 'K') size /= 1000;
		else if (unit === 'M') size = size;
		else if (unit === 'G') size /= 1000;
		else if (unit === 'T') size /= 1000000;
		else if (unit === 'P') size /= 1000000000;
		else size = undefined, error = new Error('Invalid size format.');

		callback(error, { apk_size: size });
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	if (!context.exists(output.apk_size)) return callback(new Error('Failed to get size of: ' + params.apk_name));

	var vparams = params.verify;
	var apkSize = output.apk_size;
	var maxSize = vparams.max_size;
	var maxDelta = vparams.max_delta;

	async.series([
		function (cb) {
			if (context.exists(maxSize)) {
				if (apkSize > maxSize) 
					return cb(new Error('APK size exceeds max value of ' + maxSize));
			}
			
			cb();
		},
		function (cb) {
			if (context.exists(maxDelta)) {
				context.previous(function (error, previousContext) {
					if (error || !previousContext) return cb();

					var previousSize = previousContext.output().apk_size;
					if (!context.exists(previousSize)) return cb();

					if (previousSize * (1.0 + maxDelta) < apkSize) 
						return cb(new Error('APK size increased by more than the max delta (' + maxDelta + ') ' + previousSize + ' -> ' + apkSize));

					cb();
				});
			}
			else {
				cb();
			}
		}
	], callback);
};