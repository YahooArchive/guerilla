/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Polls memory usage of an Android device.
 */

var fs = require('fs-extra');
var moment = require('moment');
var path = require('path');
var async = require('async');

function AndroidMemory (context, exec) {
	this.context = context;
	this.exec = exec;
	this.nativeFile = path.join(context.output_dir, 'memory-native.csv');
	this.dalvikFile = path.join(context.output_dir, 'memory-dalvik.csv');

	this.context.createReport({
		title: 'Native Memory',
		type: 'line',
		file: 'memory-native.csv',
		x_axis_label: 'Date',
		y_axis_label: 'MB',
	});

	this.context.createReport({
		title: 'Dalvik Memory',
		type: 'line',
		file: 'memory-dalvik.csv',
		x_axis_label: 'Date',
		y_axis_label: 'MB',
	});

	this.native_count = 0;
	this.dalvik_count = 0;
	this.stats = {
		native_size_average: 0,
		native_size_max: 0,
		native_allocated_average: 0,
		native_allocated_max: 0,
		native_free_average: 0,
		native_free_max: 0,
		dalvik_size_average: 0,
		dalvik_size_max: 0,
		dalvik_allocated_average: 0,
		dalvik_allocated_max: 0,
		dalvik_free_average: 0,
		dalvik_free_max: 0
	}
}

function update (key, heapArray, date) {
	var self = this;
	if (!heapArray) return;
	if (!date) date = moment().format('M/D/YY h:mm:ss A');
		
	fs.appendFile(self[key + 'File'], date + ',' + heapArray.join() + '\n', function () {});

	key += '_';

	var count = Number(++self[key + 'count']);
	var heap = {
		size: Number(heapArray[0]) / 1000,
		allocated: Number(heapArray[1]) / 1000,
		free: Number(heapArray[2]) / 1000
	};

	['size', 'allocated', 'free'].forEach(function (mem) {
		var prefix = key + mem + '_';
		self.stats[prefix + 'average'] = ((self.stats[prefix + 'average'] * (count - 1)) + heap[mem]) / count;
		self.stats[prefix + 'max'] = Math.max(self.stats[prefix + 'max'], heap[mem]);
	});
}

AndroidMemory.prototype.start = function (packageName, callback) {
	var self = this;

	async.parallel([
		function (cb) {
			fs.appendFile(self.nativeFile, 'Date,Size,Allocated,Free\n', cb);
		},
		function (cb) {
			fs.appendFile(self.dalvikFile, 'Date,Size,Allocated,Free\n', cb);
		}
	], function (error) {
		if (error) return callback(error)

		var cmd = 'adb';

		var args = [];
		args.push('-s');
		args.push(self.context.device.identifier);
		args.push('shell');
		args.push('dumpsys');
		args.push('meminfo');
		args.push(packageName);

		self.interval = setInterval(function () {
			var nativeHeap;
			var dalvikHeap;

			function stdout (data) {
				var lines = data.split(/\r?\n/);

				lines.forEach(function (line) {
					words = line.split(new RegExp('\\s+'));

					if (words.length > 4) {
						var process = words[1];
						var length = words.length;

						if (process === 'Native') {
							nativeHeap = words.slice(-3);
						}
						if (process === 'Dalvik' && words[2] !== 'Other') {
							dalvikHeap = words.slice(-3);
						}
					}
				});
			}

			var options = { stdout: stdout, log: 'none' };

			self.exec(cmd, args, options, function (error) {
				if (error) return;
				var date = moment().format('M/D/YY h:mm:ss A');
				update.apply(self, ['native', nativeHeap, date]);
				update.apply(self, ['dalvik', dalvikHeap, date]);
			});
		}, 1000);

		if (callback) callback();
	});
};

AndroidMemory.prototype.stop = function (callback) {
	clearInterval(this.interval);
	if (callback) callback();
};

module.exports = AndroidMemory;
