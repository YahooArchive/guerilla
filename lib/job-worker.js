/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Entry point for a new forked node process to execute a job.
 */

import utilities from './utilities';

require('./globals');

var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var config = require('./config');
var db = require('./db');

var result;
var job;

db.connect(config.db, function (error) {
	if (error) return result.finish(error, process.exit);

	var Result = db.models().Result;
	var Job = db.models().Job;

	async.parallel({
		job: function (callback) {
			Job.findById(argv.job_id, callback);
		},
		result: function (callback) {
			Result.findById(argv.result_id, callback);
		}
	}, function (error, results) {
		if (error)
			return process.exit();

		job = results.job;
		result = results.result;

		if (!job || !result) 
			return process.exit();

		var deviceManager = require('./device-manager');
		var device = deviceManager.findByTag(job.device_tag);

		result.worker_url = config.getUrl();
		result.worker_name = config.name;
		result.device = device;
		result.output_dir = path.join(config.getResultsDir(), job.id.toString(), result.number.toString());

		result.start(function (error) {
			if (error)
				return finish(error, process.exit);

			var JobExecutor = require('./job-executor');
			var executor = new JobExecutor(job, result, device);
			executor.execute(function (error) {
				result.finish(null, function () {
					job.sendMail(argv.master_url, result, process.exit);
				});
			});
		});
	});
});

process.on('SIGTERM', function () {
	if (result) result.finish(new Error('Job timed out after ' + job.timeout + ' seconds.'), process.exit);
	else process.exit();
});

process.on('SIGINT', function () {
	if (result) result.interrupt(process.exit);
	else process.exit();
});

process.on('uncaughtException', function (ex) {
	logger.e(ex.stack);
	if (result) result.finish(ex.stack, process.exit);
	else process.exit();
});