/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Utility to find files.
 */

var path = require('path');

function Finder (context, exec) {
	this.context = context;
	this.exec = exec;
}

Finder.prototype.find = function (file, cwd, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}

	var cmd = 'sh';

	var args = [];
	args.push('-c');
	if (options.format === 'parent')
		args.push('find . -name "' + file + '" -print0 | xargs -0 -n1 dirname | sort --unique');
	else 
		args.push('find . -name "' + file + '"');

	var buffer = ''
	function stdout (data) {
		buffer += data;
	}

	var opts = { stdout: stdout, cwd: cwd };

	this.exec(cmd, args, opts, function (error) {
		if (error)
			return callback(new Error('Error finding file: ' + file));

		var found = buffer.split('\n');
		found.pop();

		var retVal;

		if (options.unique) {
			if (found.length < 1)
				return callback(new Error('Could not find any unique files for: ' + file));
			if (found.length > 1)
				return callback(new Error('Found more than one file for: ' + file + '. <' + found + '>'));

			retVal = path.join(cwd, found[0]);
		}
		else {
			retVal = [];
			found.forEach(function (file) {
				retVal.push(path.join(cwd, file));
			});
		}
		
		callback(null, retVal);
	});
};

module.exports = Finder;