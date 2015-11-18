/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Runs the xcrun command line tool.
 */
'use strict';

var childexec = require('child_process').exec;
var path = require('path');
var async = require('async');
var format = require("string-template");

module.exports.validate = function validate () {
	return {
		params: {
			workspace: 'required',
			scheme: 'required',
			configuration: 'optional',
			build_actions: function (p, c) {
				return (p.build_actions) ? Array.isArray(p.build_actions) : true;
			}
		},
		context: {
			project_root: 'required',
			device_identifier: function (p, c) {
				if (p.build_actions && Array.isArray(p.build_actions)) {
					if ((p.build_actions.indexOf('test') > -1) && !c.device_identifier) 
						return false;
				}
				return true;
			}
		}
	};
};

/**
 * Executes xcodebuild with the test option. It may use a simulator or a physical devices
 * We will execute the
 * @param Params
 * @param context
 * @param exec
 * @param callback
 */
function executeTest(params, context, exec, callback) {
	//todo perhaps move to xctest.js
	if (params.build_actions.length !== 1) {
		throw new Error("build actions can only have 1 test entry, found:" + JSON.stringify(params.build_actions));
	}
	if (params.build_actions[0] !== 'test') {
		throw new Error('expected build action of "test"');
	}

	var commandLineTemplate =
		'cd {cwd} && ' +
		'killall "Simulator"; ' + //Cannot use && as we may get error "no match processes belonging to you were found" and a return code > 0.
		'xcrun simctl erase all &&' +
		'xcrun -sdk {sdk} xcodebuild ' +
		'-destination "{destination}" ' +
		'-workspace "{workspace}" ' +
		'-scheme "{scheme}" ' +
		'-sdk "{sdk}" ' +
		'{configuration} ' +
		'-derivedDataPath "{derivedDataPath}" ' +
		'test | tee {resultsDir}/xcodebuild.log | xcpretty --report html --output {resultsDir}/xctestresults.html && exit ${PIPESTATUS[0]} '; //per https://github.com/supermarin/xcpretty

	var isSimulator = context.device.simulator;
	var cwd = context.project_root;
	var sdk = isSimulator ? "iphonesimulator" : "iphoneos";
	var destination = isSimulator ?
		'platform=iOS Simulator,' + context.device.destination :
		'platform=iOS,id=' + context.device_identifier;
	var workspace = params.workspace + '.xcworkspace';
	var scheme = params.scheme;
	var configuration = params.configuration ? '-configuration "' + params.configuration + '"' : '';
	var derivedDataPath = context.build_dir;
	var resultsDir = context.output_dir;

	var commandLine = format(commandLineTemplate, {
		cwd: cwd,
		sdk: sdk,
		destination: destination,
		workspace: workspace,
		scheme: scheme,
		configuration : configuration,
		derivedDataPath: derivedDataPath,
		resultsDir: resultsDir
	});

	logger.d("xcrun executeTest command line="+commandLine);

	async.series([
		function (cb) {
			var options = {cwd: context.project_root};
			var child = childexec(commandLine, options,
				function (error, stdout, stderr) {
					if (error !== null) {
						logger.i('exec error: ' + error);
						return cb(error);
					}
					return cb();
				});
		}
	], function (error, results) {
		callback(error);
	});
}

/**
 * Execute xcodebuild without the test option.
 * @param params
 * @param context
 * @param exec
 * @param callback
 */
function executeNoTest(params, context, exec, callback) {

	var errors = [];

	async.series([
		function (cb) {
			var cmd = 'xcrun';

			var args = [];
			args.push('-sdk');
			var isSimulator = context.device.simulator;
			var sdkArg = isSimulator ? "iphonesimulator" : "iphoneos";
			args.push(sdkArg);
			args.push('xcodebuild');
			args.push('-workspace');
			args.push(params.workspace + '.xcworkspace');
			args.push('-scheme');
			args.push(params.scheme);
			if (params.configuration) {
				args.push('-configuration');
				args.push(params.configuration);
			}
			args.push('-sdk');
			args.push(sdkArg);

			if (context.device_identifier) {
				//for simulator a sample destination is 'platform=iOS Simulator,name=iPhone 6,OS=9.1'
				var destArg = isSimulator ?
				'platform=iOS Simulator,' + context.device.destination :
				'platform=iOS,id=' + context.device_identifier;
				args.push('-destination');
				args.push(destArg);
			}
			args.push('-derivedDataPath');
			args.push(context.build_dir);
			if (params.build_actions) {
				params.build_actions.forEach(function (action) {
					args.push(action);
				});
			}


			var options = {cwd: context.project_root};

			exec(cmd, args, options, function (error) {
				if (error) errors.push(error);
				cb();
			});
		},
		function (cb) {
			var service = new context.services.FinderService(context, exec);
			service.find('*.app', context.build_dir, {unique: true}, function (error, result) {
				context.app_path = result;
				cb(error);
			});
		}
	], function (error) {
		if (error) errors.push(error);
		callback(errors);
	});
}


module.exports.execute = function execute (params, context, exec, callback) {
	context.build_dir = path.join(context.working_dir, 'build');
	if (params.build_actions.indexOf("test") > -1) {
		return executeTest(params, context, exec, callback);
	} else {
		return executeNoTest(params, context, exec, callback);
	}

};