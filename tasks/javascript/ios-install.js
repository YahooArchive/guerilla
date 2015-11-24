/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an application on an iOS device.
 */

var path = require('path');

module.exports.validate = function validate () {
	return {
		context: {
			app_path: 'required',
			device: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	context.addPostJobTask({
		type: 'javascript',
		task: 'ios-uninstall'
	});

	var cmd = path.join(__rootdir, 'node_modules', 'ios-deploy', 'build', 'Release', 'ios-deploy');

	var args = [];
	args.push('-i');
	args.push(context.device.identifier);
	args.push('-b');
	args.push(context.app_path);
	args.push('-t');
	args.push('10');
	args.push('-v');
	args.push('-r');

	exec(cmd, args, {}, function (error) {
		if (!error) 
			return callback();

		args.pop();
		exec(cmd, args, {}, callback);
	});
};