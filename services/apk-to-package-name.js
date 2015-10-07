/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Finds the package name from a .apk file.
 */

var path = require('path');

function APKToPackageName (context, exec) {
	this.context = context;
	this.exec = exec;

	if (!this.context.package_name)
		this.context.package_name = {};
}

APKToPackageName.prototype.convert = function (apkDir, apkName, callback) {
	var self = this;
	var apk = path.join(apkDir, apkName);

	if (self.context.package_name[apk]) return callback(null, self.context.package_name[apk]);

	var cmd = './aapt';

	var args = [];
	args.push('dump');
	args.push('badging');
	args.push(apk);
	
	var packageName;
	function stdout (data) {
		var array = data.split('name=\'');
		if (array[1]) 
			packageName = array[1].split('\'')[0];
	}

	var options = { stdout: stdout, cwd: path.join(self.context.bin_dir, 'aapt') };

	this.exec(cmd, args, options, function (error) {
		if (error)
			return callback(error);

		setTimeout(function () {
			if (!packageName)
				return callback('Could not resolve package name from apk: ' + apk);

			self.context.package_name[apk] = packageName;
			callback(null, self.context.package_name[apk]);
		}, 500);
	});
};

module.exports = APKToPackageName;