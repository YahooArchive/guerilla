/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Takes a screenshot of an Android device.
 */

var path = require('path');
var async = require('async');
var moment = require('moment');

function AndroidScreenshot (context, exec) {
	this.context = context;
	this.exec = exec;
}

AndroidScreenshot.prototype.snap = function (callback) {
	var filename = 'screenshot_' + moment().format('M-D-YY_H-mm-ss') + '.png';

	var cmd = 'sh';

	var args = [];
	args.push('-c');
	args.push('adb -s ' + this.context.device.identifier + ' shell screencap -p | perl -pe "s/\\x0D\\x0A/\\x0A/g" > ' + filename);

	var options = { cwd: this.context.output_dir };

	this.exec(cmd, args, options, function (error) {
		callback();
	});
};

module.exports = AndroidScreenshot;
