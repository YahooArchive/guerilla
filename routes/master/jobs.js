/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all job endpoints.
 */

import utilities from '../lib/utilities';

var router = require('express').Router();
var path = require('path');
var models = require(path.join(__rootdir, 'lib', 'db')).models();

var Job = models.Job;
var ConfigLocation = models.ConfigLocation;

router.get('/jobs/:job_id', function (req, res, next) {
	Job.statics.populateById(req.params.job_id, function (error, job) {
		if (error || !job)
			return next(new Error(error));

		res.render('master/job', { job: job });
	});
});

router.get('/projects/:project_id/jobs/create', function (req, res, next) {
	res.render('master/create-job', { project_id: req.params.project_id });
});

router.post('/projects/:project_id/jobs', function (req, res, next) {
	var json = req.body;
	json.project_id = req.params.project_id;

	ConfigLocation.statics.createWithJSON(req.body, function (error, configLocation) {
		if (error || !configLocation) 
			return res.send({ success: false });

		Job.statics.findByConfigLocationId(configLocation.id, function (error, job) {
			if (error || !job) 
				return res.send({ success: false });

			res.send({ success: true, redirect: '/jobs/' + job.id });
		});
	});
});

router.get('/projects/:project_id/jobs/:job_id', function (req, res, next) {
	res.redirect('/jobs/' + req.params.job_id);
});

router.get('/projects/:project_id/jobs/:job_id/edit', function (req, res, next) {
	ConfigLocation.statics.findByJobId(req.params.job_id, function (error, configLocation) {
		if (error || !configLocation)
			return next(new Error(error));

		res.render('master/edit-job', { 
			project_id: req.params.project_id, 
			job_id: req.params.job_id, 
			config_location: configLocation 
		});
	});
});

router.put('/projects/:project_id/jobs/:job_id', function (req, res, next) {
	ConfigLocation.statics.findByJobId(req.params.job_id, function (error, configLocation) {
		if (error || !configLocation)
			return res.send({ success: false });

		configLocation.edit(req.body, function (error, configLocation) {
			if (error) 
				return res.send({ success: false });

			res.send({ success: true, redirect: '/jobs/' + req.params.job_id });
		});
	});
});

router.post('/jobs/:job_id/start', function (req, res, next) {
	var referrer = req.get('Referrer');

	Job.findById(req.params.job_id, function (error, job) {
		if (error || !job) {
			if (referrer) next(error);
			else res.send({ success: false, error: error });
			return;
		}

		job.enqueue(function (error) {
			if (error) {
				if (referrer) next(error);
				else res.send({ success: false, error: error });
				return;
			}
			
			if (referrer) res.redirect(referrer);
			else res.send({ success: true });
		});
	});
});

router.post('/jobs/:job_id/stop', function (req, res, next) {
	var referrer = req.get('Referrer');

	Job.findById(req.params.job_id, function (error, job) {
		if (error || !job) {
			if (referrer) next(error);
			else res.send({ success: false, error: error });
			return;
		}

		job.stop(function (error) {
			if (error) {
				if (referrer) next(error);
				else res.send({ success: false, error: error });
				return;
			}
			
			if (referrer) res.redirect(referrer);
			else res.send({ success: true });
		});
	});
});

router.delete('/jobs/:job_id', function (req, res, next) {
	Job.destroyById(req.params.job_id, function (error) {
		if (error)
			return res.send({ success: false });

		res.send({ success: true, redirect: '/' });
	});
});

module.exports = router;