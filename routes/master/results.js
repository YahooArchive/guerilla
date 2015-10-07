/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all result endpoints.
 */

var router = require('express').Router();
var path = require('path');
var async = require('async');
var request = require('request');
var models = require(path.join(__rootdir, 'lib', 'db')).models();
var Result = models.Result;
var Job = models.Job;

function forward (req, res, next) {
	Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, function (error, result) {
		if (error || !result) return next(new Error(error));
		if (!result.worker_url) return next();

		try {
			var url = result.worker_url + req.url.slice(1);
			request.get(url).on('error', function (error) {
				next(error);
			}).pipe(res);
		}
		catch (ex) {
			next(ex);
		}
	});
}

router.get('/jobs/:job_id/results/:result_number', function (req, res, next) {
	async.parallel({
		j: function (cb) {
			Job.statics.populateById(req.params.job_id, cb);
		},
		r: function (cb) {
			Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, cb);
		}
	}, function (error, results) {
		if (error || !results.j || !results.r)
			return next(new Error(error));

		var job = results.j;
		var result = results.r;
		var result_count = job.results.length;

		delete job.results;
		
		res.render('master/result', { job: job, result: result, result_count: result_count });
	});
});

router.get('/jobs/:job_id/results/:result_number/:filename', forward);

router.get('/jobs/:job_id/results/:result_number/files', forward);

module.exports = router;