/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an application and runs UIAutomation scripts on an iOS device. Outputs the Instruments trace, iOS system log and iOS device logs.
 */

var fs = require('fs-extra');
var path = require('path');
var async = require('async');
var plist = require('plist');

module.exports.validate = function validate () {
	return {
		params: {
			test_file: 'required',
			trace_template: 'optional'
		},
		context: {
			device: 'required',
			app_path: 'required',
			project_root: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var errors = [];

	var systemLogService = new context.services.iOSSystemLogService(context, exec);
	var startDate = new Date();

	async.series([
		function (cb) {
			context.runTask({ 
				type: 'javascript', 
				task: 'ios-install'
			}, cb);
		},
		function (cb) {
			systemLogService.start(function () { cb() });
		},
		function (cb) {
			var traceTemplate = params.trace_template || '/Applications/Xcode.app/Contents/Applications/Instruments.app/Contents/PlugIns//AutomationInstrument.xrplugin/Contents/Resources/Automation.tracetemplate';

			var cmd = 'instruments';

			var args = [];
			args.push('-w');
			args.push(context.device.identifier);
			args.push('-D');
			args.push(path.join(context.output_dir, 'Instruments'));
			args.push('-t');
			args.push(traceTemplate);
			args.push(context.app_path);
			args.push('-e');
			args.push('UIASCRIPT');
			args.push(params.test_file);
			args.push('-e');
			args.push('UIARESULTSPATH');
			args.push(context.output_dir);

			var options = { 
				cwd: context.project_root, 
				file: path.join(context.output_dir, 'instruments-log.txt'),
				log: [true, false, false, true]
			};

			exec(cmd, args, options, function (error) {
				if (error) errors.push(new Error(error));
				cb();
			});
		},
		function (cb) {
			// Give Guided Access time to turn off. Instruments (prior task) is done once the app exits, Guerilla will immediately continue processing. Concurrently the the 
			// application running on the device restarts after exiting and at this point and GuerillaMonkey will 
			// finally turn off Guided Access and exit. We want to give GuerillaMonkey time to do its work and make sure we do not prematurely remove the application from the device.
			//
			// An alternative would be to have a retry loop that queried the sys.log to verify that Guided Access is off.
			//
			// Failure to wait for Guided Access to turn off may result in the Device being locked in Guided Access, with the app removed. At that point
			// the device must be reset (power + home) twice.
			context.runTask({ 
				type: 'javascript', 
				task: 'wait',
				seconds: 60
			}, cb);
		},
		function (cb) {
			systemLogService.stop();
			
			context.runTask({ 
				type: 'javascript', 
				task: 'ios-extract-device-logs',
				start_date: startDate
			}, cb);
		},
		function (cb) {
			var cmd = 'zip';

			var args = [];
			args.push('-r');
			args.push('Instruments.trace.zip');
			args.push('Instruments.trace');
			
			var options = { cwd: context.output_dir };

			exec(cmd, args, options, function (error) {
				if (error) errors.push(new Error(error));
				cb();
			});
		}
	], function (error) {
		if (error) errors.push(error);
		callback(errors, null, true);
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	function findFailingTest (array) {
		for (var i = 0; i < array.length; i++) {
			var dict = array[i];
			
			if (dict['LogType'] === 'Fail' || dict['LogType'] === 'Error') {
				return true;
			}

			if (dict['children']) {
				if (findFailingTest(dict['children'])) {
					return true;
				}
			}
		}

		return false;
	}

	fs.readFile(path.join(context.output_dir, 'Run 1/Automation Results.plist'), 'utf8', function (error, file) {
		if (error || !file) return callback(new Error(error));

		var testResults = plist.parse(file, 'utf8');
		var failed = findFailingTest(testResults['All Samples']);
		if (failed) return callback(new Error('Test failure.'));

		callback(null, true);
	});
};