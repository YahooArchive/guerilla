/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Cleans the working directory of the job.
 */

module.exports.execute = function execute (params, context, exec, callback) {
	var cmd = 'rm';

	var args = [];
	args.push('-r');
	args.push('-f');
	args.push(context.working_dir);

	exec(cmd, args, {}, function (error) {
		callback(error, null, true);
	});
};