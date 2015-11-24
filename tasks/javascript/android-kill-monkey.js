/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Terminates any monkey processes running on an Android device.
 */

var path = require('path');
var async = require('async');

module.exports.validate = function validate () {
	return {
		context: {
			device: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var cmd = 'sh';

	var args = [];
	args.push('-c');
	args.push('adb -s ' + context.device.identifier + ' shell ps | awk \'/com\.android\.commands\.monkey/ { system("adb shell kill " $2) }\'');

	exec(cmd, args, {}, callback);
};
