/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Polls network usage of an Android device.
 */

var fs = require('fs-extra');
var async = require('async');
var path = require('path');
var moment = require('moment');

function AndroidNetwork (context, exec) {
	this.context = context;
	this.exec = exec;
	this.file = path.join(context.output_dir, 'network.csv');

	this.context.createReport({
		title: 'Network',
		type: 'line',
		file: 'network.csv',
		x_axis_label: 'Date',
		y_axis_label: 'Bytes',
	});

	this.count = 0;
	this.stats = {
		total_bytes_sent: 0,
		total_bytes_received: 0,
		average_bytes_sent_per_second: 0,
		average_bytes_received_per_second: 0
	}
}

function update (bytes) {
	if (bytes.length !== 2) return;

	var date = moment().format('M/D/YY h:mm:ss A,');

	var rawSent = parseInt(bytes[0]);
	var rawReceived = parseInt(bytes[1]);

	if (isNaN(rawSent)) rawSent = 0;
	if (isNaN(rawReceived)) rawReceived = 0;

	if (!this.sentOffset) this.sentOffset = rawSent;
	if (!this.receivedOffset) this.receivedOffset = rawReceived;

	var sent = Math.max(this.stats.total_bytes_sent, rawSent - this.sentOffset);
	var received = Math.max(this.stats.total_bytes_received, rawReceived - this.receivedOffset);

	fs.appendFile(this.file, date + sent + ',' + received + '\n', function () {});

	this.count++;
	this.stats.total_bytes_sent = sent;
	this.stats.total_bytes_received = received;
	this.stats.average_bytes_sent_per_second = sent / this.count;
	this.stats.average_bytes_received_per_second = received / this.count;
}

AndroidNetwork.prototype.start = function (packageName, callback) {
	var self = this;

	var uid;

	async.series([
		function (cb) {
			fs.appendFile(self.file, 'Date,Sent,Received\n', cb);
		},
		function (cb) {
			var cmd = 'sh';

			var args = [];
			args.push('-c');
			args.push('adb -s ' + self.context.device_identifier + ' shell dumpsys package ' + packageName + ' | grep userId=');

			var buffer = '';
			function stdout (data) {
				buffer += data;
			}

			var options = { stdout: stdout };

			self.exec(cmd, args, options, function (error) {
				if (error) return cb(error);
				uid = buffer.trim().split(new RegExp('\\s+'))[0].split('=')[1];
				cb();
			});
		}
	], function (error) {
		if (error) return callback(error);
		if (!uid) return cb(new Error('Could not find UID from package name: ' + packageName));

		var cmd = 'adb';

		var args = [];
		args.push('-s');
		args.push(self.context.device_identifier);
		args.push('shell');
		args.push('cat proc/uid_stat/' + uid + '/tcp_snd ; cat proc/uid_stat/' + uid + '/tcp_rcv');

		self.interval = setInterval(function () {
			var buffer = '';
			function stdout (data) {
				buffer += data
			}

			var options = { stdout: stdout, log: 'none' };

			self.exec(cmd, args, options, function () {
				var bytes = buffer.trim().split('\r\n');
				update.apply(self, [bytes]);
			});
		}, 1000);

		if (callback) callback();
	});

};

AndroidNetwork.prototype.stop = function (callback) {
	clearInterval(this.interval);
	if (callback) callback();
};

module.exports = AndroidNetwork;
