/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Finds the bundle identifier from a .app/.ipa file.
 */

var path = require('path');

function AppToBundleIdentifier (context, exec) {
	this.context = context;
	this.exec = exec;

	if (!this.context.bundle_identifier)
		this.context.bundle_identifier = {};
}

AppToBundleIdentifier.prototype.convert = function (appPath, callback) {
	var self = this;
	if (self.context.bundle_identifier[appPath]) return callback(null, self.context.bundle_identifier[appPath]);

	var cmd = 'defaults';

	var args = [];
	args.push('read');
	args.push(path.join(appPath, 'Info'));
	args.push('CFBundleIdentifier');
	
	var bundleIdentifier;
	function stdout (data) {
		bundleIdentifier = data.trim();
	}

	var options = { stdout: stdout };

	this.exec(cmd, args, options, function (error) {
		if (error)
			return callback(error);

		setTimeout(function () {
			if (!bundleIdentifier)
				return callback('Could not resolve bundle identifier from app: ' + appPath);

			self.context.bundle_identifier[appPath] = bundleIdentifier;
			callback(null, self.context.bundle_identifier[appPath]);
		}, 500);
	});
};

module.exports = AppToBundleIdentifier;