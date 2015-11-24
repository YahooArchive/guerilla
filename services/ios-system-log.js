/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Retrieves the system log from an iOS device.
 */

var path = require('path');

function iOSSystemLog (context, exec) {
	this.context = context;
	this.exec = exec;
	this.file = path.join(context.output_dir, 'system-log.txt');
}

iOSSystemLog.prototype.start = function (callback) {
	var cmd = path.join(__rootdir, 'node_modules', 'deviceconsole', 'deviceconsole');

	var args = [];
	args.push('-u');
	args.push(this.context.device.identifier);

	var options = { 
		log: [true, false, false, false], 
		file: this.file
	};

	this.process = this.exec(cmd, args, options, function () {});
	if (callback) callback();
};

iOSSystemLog.prototype.stop = function (callback) {
	if (this.process) this.process.kill();
	if (callback) callback();
};

module.exports = iOSSystemLog;
