/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Uses Applescript to extract device logs from an iOS device via Xcode.
 */

var async = require('async');
var path = require('path');
var fs = require('fs-extra');

module.exports.validate = function validate () {
	return {
		params: {
			start_date: 'optional'
		},
		context: {
			device: 'required',
			app_path: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var startDate = new Date((params.start_date) ? new Date(params.start_date) - 60000 : new Date() - 1800000);
    var filesToSymbolicate = [];

	async.series([
		function (cb) {
			var cmd = 'osascript';

			var args = [];
			args.push('ios-extract-device-logs.scpt');
			args.push(context.device.identifier);
			args.push(context.output_dir);
			args.push(startDate.toString());

			var options = { timeout: 60 * 15, cwd: path.join(context.bin_dir, 'ios-extract-device-logs') };

			exec(cmd, args, options, cb);
		},
		function (cb) {
			var outputFiles = fs.readdir(context.output_dir, function (error, outputFiles) {
				if (error) return cb(error);

				var filesToRemove = [];
				outputFiles.forEach(function (file) {
					if (file.lastIndexOf('device_log', 0) === 0) {
						var splitFilename = file.split('+');
						var uglyDateTime = splitFilename[splitFilename.length - 1].split('.')[0];
						var splitUglyDateTime = uglyDateTime.split(', ');
						var date = splitUglyDateTime[0];
						var time = splitUglyDateTime[1].replace('-', ':');
						var dateTime = date + ' ' + time;
						var dateObject = new Date(dateTime);
						if (dateObject <= startDate) 
							filesToRemove.push(file);
						else
							filesToSymbolicate.push(file);
					}
				});

				filesToRemove.forEach(function (file) {
					fs.remove(path.join(context.output_dir, file));
				});

				cb();
			});
		},
		function (cb) {
			var cmd = 'cp';
	
			var args = [];
			args.push('-R')
			args.push(context.app_path);
			args.push(context.output_dir);

			exec(cmd, args, {}, cb);
		},
		function (cb) {
			async.each(filesToSymbolicate, function (file, cb) {
				var cmd = '/Applications/Xcode.app/Contents/SharedFrameworks/DTDeviceKitBase.framework/Versions/A/Resources/symbolicatecrash';

				var args = [];
				args.push('-v');
				args.push('-o');
				args.push(file + '.symbolicated.txt'); //TODO: overwrite existing file or rempove existing file when done
				args.push(path.join(context.output_dir, file));
				
				var env = Object.create(process.env);
				env.DEVELOPER_DIR = '/Applications/Xcode.app/Contents/Developer';
				
				var logFile = path.join(context.output_dir, file + '.symbolicated.log.txt');
				function stderr (data) {
					fs.appendFile(logFile, data, function () {});
				}

				var options = { env: env, cwd: context.output_dir, stderr: stderr };
							
				exec(cmd, args, options, function (error) { 
					if (error) context.log(error);
					cb(); 
				});
			}, cb);
		}
	], function (error) {
		var cmd = 'rm';
	
		var args = [];
		args.push('-rf')
		args.push(path.basename(context.app_path));

		var options = { cwd: context.output_dir };

		exec(cmd, args, options, callback);
	});
};