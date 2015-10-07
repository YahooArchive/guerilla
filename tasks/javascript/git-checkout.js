/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Checks out a project from GitHub.
 */

var async = require('async');
var path = require('path');

module.exports.validate = function validate () {
	return {
		params: {
			checkout_url: 'required',
			branch: 'optional',
			project_root: 'optional'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var output = {};
	context.checkout_root = path.join(context.working_dir, 'project');
	context.project_root = params.project_root ? path.join(context.checkout_root, params.project_root) : context.checkout_root;

	async.series([
		function (cb) {
			var cmd = 'git';

			var args = [];
			args.push('clone');
			if (params.branch) {
				args.push('-b');
				args.push(params.branch);
				args.push('--single-branch');
			}
			args.push(params.checkout_url);
			args.push(context.checkout_root);

			exec(cmd, args, {}, cb);
		},
		function (cb) {
			var cmd = 'git';
			
			var args = [];
			args.push('submodule');
			args.push('update');
			args.push('--init');
			args.push('--force');
			args.push('--recursive');
			
			var options = { cwd: context.checkout_root };

			exec(cmd, args, options, cb);
		},
		function (cb) {
			var cmd = 'git';

			var args = [];
			args.push('rev-parse');
			if (params.branch)
				args.push('remotes/origin/' + params.branch + '^{commit}');
			else
				args.push('remotes/origin/HEAD^{commit}');

			function stdout (data) {
				if (data.length === 41)
					output.version = data.trim();
			}

			var options = { stdout: stdout, cwd: context.checkout_root };

			exec(cmd, args, options, function () {
				cb();
			});
		},
	], function (error) {
		callback(error, output);
	});
};