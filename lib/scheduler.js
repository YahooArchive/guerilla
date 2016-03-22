/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Schedules jobs on a cron time.
 */

var path = require('path');
var async = require('async');
var CronJob = require('cron').CronJob;
var models = require('./db').models();
var Job = models.Job;

function Scheduler () {
	this.scheduledJobs = {};
}

function isValidCronTime (cronTime) {
	if (!cronTime || cronTime === '')
		return false;

	var valid = true;

	try {
        var c = new CronJob(cronTime, function () {
        	c.stop();
        });
    }
    catch (ex) {
    	valid = false;
	}
    finally {
    	return valid;
    }
}

Scheduler.prototype.schedule = function (job) {
	var self = this;
	if (self.scheduledJobs[job.id]) {
		self.scheduledJobs[job.id].stop();
		delete self.scheduledJobs[job.id];
	}

	if (job.enabled && isValidCronTime(job.cron_time)) {
		self.scheduledJobs[job.id] = new CronJob(job.cron_time, function () {
			Job.findById(job.id, function (error, j) {
				if (error || !j) return;
				j.enqueue(function () {});
			});
		}, null, true);
	}
}

Scheduler.prototype.init = function (callback) {
	var self = this;
	Job.all(function (error, jobs) {
		if (error) return callback(error);
		async.each(jobs, function (job, cb) {
			self.schedule(job);
			cb();
		}, callback);
	});
}

module.exports = new Scheduler();