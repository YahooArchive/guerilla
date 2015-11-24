/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Retrieves the Logcat from an Android device.
 */

var path = require('path');
var fs = require('fs-extra');

function Logcat (context, exec) {
	this.context = context;
	this.exec = exec;
	this.file = path.join(context.output_dir, 'logcat.txt');
}

Logcat.prototype.start = function (callback) {
	var self = this;

	var cmd = 'adb';

	var args = [];
	args.push('-s');
	args.push(self.context.device.identifier);
	args.push('logcat');
	args.push('-v');
	args.push('time');

	var options = { log: [true, false, false, false], file: this.file };

	self.process = self.exec(cmd, args, options, function () {});
	if (callback) callback();
};

Logcat.prototype.stop = function (callback) {
	if (this.process) this.process.kill();
	if (callback) callback();
};

module.exports = Logcat;