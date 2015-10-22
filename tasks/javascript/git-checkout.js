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
		// Process the optional "pull" parameter (part1/2). If present we pull from pull's argument (the branch).
		function (cb) {
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = "git";
			var args = [];
			args.push('pull');
			args.push(params.pull);

			var options = {cwd: context.checkout_root};
			exec(cmd, args, options, cb);

		},
		// Process the optional "pull" parameter (part2/2). If any conflicts we stop with an error.
		function (cb){
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = 'git';
			var args = [];
			args.push('diff');
			args.push('--name-only');
			args.push('--diff-filter=U');
			var hasError = false;
			function stdout (data) {
				if (data.length > 0 ) {
					hasError = true;
					output.conflicts = data;
				} else {
					output.noconflicts = 'Pull requested. No Merge conflicts with: ' + params.pull;
				}
			}

			var options = { stdout: stdout, cwd: context.checkout_root };

			exec(cmd, args, options, function () {
				if (hasError) {
					cb(new Error('Pull requested. Merge conflicts with: ' + params.pull + ": " + output.conflicts));
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
		//If we're in a pull export out the commit from the pull. TODO: show on ui. TODO: refactor redundant code
		function (cb) {
			if (!params.pull) {
				return cb(null); //nothing to do
			}
			var cmd = 'git';

			var args = [];
			args.push('rev-parse');
			args.push('remotes/origin/' + params.pull + '^{commit}');

			function stdout (data) {
				if (data.length === 41)
					output.pullversion = data.trim();
			}

			var options = { stdout: stdout, cwd: context.checkout_root };

			exec(cmd, args, options, function () {
				cb();
			});
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