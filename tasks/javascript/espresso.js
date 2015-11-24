/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an APK and runs espresso tests on an Android device. Outputs network usage, memory usage and logcat.
 */

var async = require('async');
var path = require('path');
var fs = require('fs-extra');

module.exports.validate = function validate () {
	return {
		params: {
			apk_name: 'required',
			test_apk_name: 'required',
			test_class: 'optional',
			test_name: 'optional'
		},
		context: {
			apk_dir: 'required',
			device: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var packageName;
	var logcatService = new context.services.LogcatService(context, exec);
	var androidMemoryService = new context.services.AndroidMemoryService(context, exec);
	var androidNetworkService = new context.services.AndroidNetworkService(context, exec);

	async.series([
		function (cb) {
			context.runTask({ 
				type: 'javascript', 
				task: 'android-install',
				apk_name: params.apk_name
			}, cb);
		},
		function (cb) {
			context.runTask({ 
				type: 'javascript', 
				task: 'android-install',
				apk_name: params.test_apk_name
			}, cb);
		},
		function (cb) {
			var service = new context.services.APKToPackageNameService(context, exec);
			service.convert(context.apk_dir, params.apk_name, function (error, result) {
				packageName = result;
				cb(error);
			});
		},
		function (cb) {
			logcatService.start(function () { cb(); });
		},
		function (cb) {
			androidMemoryService.start(packageName, function () { cb(); });
		},
		function (cb) {
			androidNetworkService.start(packageName, function () { cb(); });
		},
		function (cb) {
			context.addPostJobTask({
				type: 'javascript',
				task: 'android-force-stop',
				package_name: packageName
			});

			var cmd = 'adb';

			var args = [];
			args.push('-s');
			args.push(context.device.identifier);
			args.push('shell');
			args.push('am');
			args.push('instrument');
			args.push('-w');
			
			if (params.test_class_name) {
				args.push('-e');
				args.push('class');
				var test_path = packageName + '.' + params.test_class_name;
				if (params.test_name) test_path += '#' + params.test_name;
				args.push(test_path);
			}

			args.push(packageName + '.test/android.support.test.runner.AndroidJUnitRunner');

			var options = { 
				file: path.join(context.output_dir, 'espresso-log.txt'), 
				log: [true, false, false, true]
			};
			
			exec(cmd, args, options, cb);
		}
	], function (error) {
		androidNetworkService.stop();
		androidMemoryService.stop();
		logcatService.stop();

		callback(error);
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	fs.readFile(path.join(context.output_dir, 'espresso-log.txt'), 'utf8', function (error, file) {
		if (error || !file) return callback(new Error(error));
	    
		var data = {};

	    var lines = file.trim().split('\n');
		var lastLine = lines.slice(-1)[0];

		data.tests_ran = lastLine.match(/\d+/)[0];

		if (lastLine.indexOf('OK') != -1) {
			data.tests_passed = data.tests_ran;
		} 
		else if (lastLine.indexOf('Failure') != -1) {
			var matches = lastLine.match(/(\d+),  Failures: (\d+)/);
			var tests_failed = matches[2];
			data.tests_passed = data.tests_ran - tests_failed;
			return callback(new Error('Test failed: ' + data.tests_passed + '/' + data.tests_ran));
		}
		else {
			return callback(new Error('Unexpected results'));
		}
		
		callback(null, data);
	});
}




