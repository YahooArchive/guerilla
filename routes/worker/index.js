/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Main router for the express application.
 */

var router = require('express').Router();
var path = require('path');
var async = require('async');
var queueWorker = require(path.join(__rootdir, 'lib', 'queue-worker'));
var models = require(path.join(__rootdir, 'lib', 'db')).models();
var Job = models.Job;
var Result = models.Result;

router.get('/', function (req, res, next) {
	var jobs = queueWorker.activeJobs();

	var activeJobs = [];

	async.each(jobs, function (data, cb) {
		async.parallel({
			job: function (cb) {
				Job.statics.populateById(data.job_id, cb);
			},
			result: function (cb) {
				Result.findById(data.result_id, cb);
			}
		}, function (error, results) {
			activeJobs.push(results);
			cb();
		});

	}, function (error) {
		if (error)
			return next();

		res.render('worker/dashboard', { activeJobs: activeJobs });
	});
});

router.get('/health', function (req, res, next) {
	var jobs = queueWorker.activeJobs();
	res.send({ alive: true, active: jobs.length });
});

module.exports = router;