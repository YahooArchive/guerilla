/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Entry point for a new forked node process to execute a job.
 */

require('./globals');

var path = require('path');
var async = require('async');
var argv = require('yargs').argv;

var config = require('./config');
var utilities = require('./utilities');
var db = require('./db');

var result;
var job;

db.connect(config.db, function (error) {
	logger.d('job-worker 4:db.connect for argv.job_id: ' + argv.job_id);
	if (error) {
		logger.d('job-worker 6:db.connect ERRROR');
		return result.finish(error, process.exit);
	}

	var Result = db.models().Result;
	var Job = db.models().Job;
    logger.d('job-worker 8:db.connect argv.job_id');
	async.parallel({
		job: function (callback) {
			Job.findById(argv.job_id, callback);
		},
		result: function (callback) {
			Result.findById(argv.result_id, callback);
		}
	}, function (error, results) {
		logger.d('job-worker 10: async.parallel finished for job:' + argv.job_id);
		if (error) {
			logger.d('job-worker 11: async.parallel error for job:' + argv.job_id);
			return process.exit();
		}


		job = results.job;
		result = results.result;
		if (!job || !result) {
			logger.d('job-worker 11: !job !! !result so exiting process');
			return process.exit();
		}
		var deviceManager = require('./device-manager');
		var device = deviceManager.findByTag(job.device_tag);

		result.worker_url = config.getUrl();
		result.worker_name = config.name;
		result.device = device;
		result.output_dir = path.join(config.getResultsDir(), job.id.toString(), result.number.toString());
		logger.d('job-worker 15 about to execute result.start for job: ' + argv.job_id);
		result.start(function (error) {
			if (error) {
				logger.d('job-worker 20 result.start returned error. about to execut finish');
				return finish(error, process.exit);
			}
			var JobExecutor = require('./job-executor');
			var executor = new JobExecutor(job, result, device);
			logger.d('job-worker 25 about to start executor.execute for job ' + job.id);
			executor.execute(function (error) {
				result.finish(null, function () {
					logger.d('job-worker 30 executor.execute result.finish')
					job.sendMail(argv.master_url, result, process.exit);
				});
			});
		});
	});
});

process.on('exit', function(code){
	logger.d('process.on("exit") event handled in job-worker.js. Exiting process pid=' + process.pid);
	logger.trace();
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