/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Calculates the number of methods in an APK and outputs a breakdown report.
 */

var async = require('async');
var path = require('path');

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
	var cmd = 'java';

	var args = [];
	args.push('-jar');
	args.push('./dex-method-counts.jar');
	args.push(path.join(context.apk_dir, params.apk_name));

	var buffer = '';
	function stdout (data) {
		buffer += data;
	}

	var options = { 
		stdout: stdout, 
		file: path.join(context.output_dir, 'dex-method-counts.txt'), 
		cwd: path.join(context.bin_dir, 'dex-method-counts'),
		log: [true, false, true, true]
	};

	exec(cmd, args, options, function (error) {
		if (error) return callback(error);

		var output = { method_count: buffer.split(' ').pop().trim() };
		callback(null, output);
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	if (!context.exists(output.method_count)) return callback(new Error('Failed to get method count of: ' + params.apk_name));

	var vparams = params.verify;
	var methodCount = output.method_count;
	var maxMethodCount = vparams.max_method_count;
	var maxDelta = vparams.max_delta;

	async.series([
		function (cb) {
			if (context.exists(maxMethodCount)) {
				if (methodCount > maxMethodCount) 
					return cb(new Error('APK method count exceeds max value of ' + maxMethodCount));
			}
			
			cb();
		},
		function (cb) {
			if (context.exists(maxDelta)) {
				context.previous(function (error, previousContext) {
					if (error || !previousContext) return cb();

					var previousMethodCount = previousContext.output().method_count;
					if (!context.exists(previousMethodCount)) return cb();

					if (previousMethodCount * (1.0 + maxDelta) < methodCount) 
						return cb(new Error('APK method count increased by more than the max delta (' + maxDelta + ') ' + previousMethodCount + ' -> ' + methodCount));

					cb();
				});
			}
			else {
				cb();
			}
		}
	], callback);
};