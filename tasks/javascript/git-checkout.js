/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Checks out a project from GitHub.
 */
'use strict';

var async = require('async');
var path = require('path');

module.exports.validate = function validate () {
	return {
		params: {
			checkout_url: 'required',
			branch: 'optional',
			pull: 'optional',
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
		// Process the optional "pull" parameter (part1/2). If present we use pull's argument to format the pull cmd.
		function (cb) {
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = "git";
			var args = ['pull', '--no-edit', '--commit'].concat(params.pull);
			function stdout (data) {
				if (data) {output.pullResults = data;}
			}

			var options = { stdout: stdout, cwd: context.checkout_root};


			exec(cmd, args, options, cb);

		},
		// Process the optional "pull" parameter (part2/2). If any conflicts we stop with an error.
		function (cb){
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = 'git';
			var args = ['--no-pager', 'diff', '--name-only', '--diff-filter=U'];
			var hasError = false;
			output.conflicts = 'Pull processed with no merge conflicts';
			function stdout (data) {
				if (data.length > 0 ) {
					hasError = true;
					output.conflicts = data;}
			}

			var options = { stdout: stdout, cwd: context.checkout_root };

			exec(cmd, args, options, function () {
				if (hasError) {
					cb(new Error('Pull requested. Merge conflicts found'));
				}
				else {
					cb();
				}
			});
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
		//If we're in a pull export out the commit from the pull.
		function (cb) {
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = 'git';

			var args = ['--no-pager', 'log', '-1'];

			function stdout (data) {
				output.pullLog = data;
			}

			var options = { stdout: stdout, cwd: context.checkout_root };

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