/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Zips all output files.
 */

module.exports.execute = function execute (params, context, exec, callback) {
	var cmd = 'zip';

	var args = [];;
	args.push('-r');
	args.push('Results.zip');
	args.push('.');
	
	var options = { cwd: context.output_dir };

	exec(cmd, args, options, function (error) {
		callback(error, null, true);
	});
};