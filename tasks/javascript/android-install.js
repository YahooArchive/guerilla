/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an APK to an Android device.
 */

var path = require('path');

module.exports.validate = function validate () {
	return {
		params: {
			apk_name: 'required'
		},
		context: {
			apk_dir: 'required',
			device: 'required'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	context.addPostJobTask({
		type: 'javascript',
		task: 'android-uninstall',
		apk_name: params.apk_name
	});

	var cmd = 'adb';

	var args = [];
	args.push('-s');
	args.push(context.device.identifier);
	args.push('install');
	args.push('-r');
	args.push(path.join(context.apk_dir, params.apk_name));

	var p;

	var buffer = '';
	function stdout (data) {
		buffer += data;
	}

	var installError;
	function stderr (data) {
		var error = new RegExp('^error: ').exec(data);
		if (error) {
			installError = new Error('Error installing: ' + data);
			p.kill();
		}
	}

	var options = { stdout: stdout, stderr: stderr };

	p = exec(cmd, args, options, function (error) {
		if (installError) return callback(installError);
		if (error) return callback(error);

		var failure = new RegExp('Failure \\[.*\\]').exec(buffer);
		if (failure) return callback(new Error('Failure to install: ' + failure));

		callback();
	});
};