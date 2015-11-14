/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Runs the xcrun command line tool.
 */

var path = require('path');
var async = require('async');

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

module.exports.execute = function execute (params, context, exec, callback) {
	context.build_dir = path.join(context.working_dir, 'build');
	
	var errors = [];

	async.series([
		function (cb) {
			var cmd = 'xcrun';

			var args = [];
			args.push('-sdk');
			var isSimulator = context.device.simulator;
			logger.i("xcrun:isSimulator=" + isSimulator);
			logger.i("xcrun:context.device=" + JSON.stringify(context.device))
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
					'platform=iOS Simulator,' + context.device.destination  :
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

			var options = { cwd: context.project_root };

			exec(cmd, args, options, function (error) {
				if (error) errors.push(error);
				cb();
			});
		},
		function (cb) {
			var service = new context.services.FinderService(context, exec);
			service.find('*.app', context.build_dir, { unique: true }, function (error, result) {
				context.app_path = result;
				cb(error);
			});
		}
	], function (error) {
		if (error) errors.push(error);
		callback(errors);
	});
};