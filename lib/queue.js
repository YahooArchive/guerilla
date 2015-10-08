/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Adds and removes jobs from the queue.
 */

var async = require('async');
var kue = require('kue');
var path = require('path');
var config = require('./config');
var Result = require('./db').models().Result;

function Queue () {
	this.queue = null;
}

function forEachInQueue (queue, statusArray, callback, done) {
	async.some(statusArray, function (status, cb1) {
		queue[status](function (error, ids) {
			if (error || !ids) 
				return cb1(false);

			async.some(ids, function (id, cb2) {
				kue.Job.get(id, function (error, job) {
					if (error || !job)
						return cb2(false);

					callback(job, cb2);
				});
  			}, function () {
  				cb1(false);
  			});
		});
	}, function () {
		if (done) done();
	});
}

function isStatus (queue, job_id, status, callback) {
	queue[status](function (error, ids) {
		async.some(ids, function (id, cb) {
			kue.Job.get(id, function (error, job) {
				if (error || !job)
					return cb(false);
				if (job_id === job.data.job_id)
					return cb(true);
				cb(false);
			});
		}, function (result) {
			callback(null, result);
		});
	});
}

Queue.prototype.init = function (callback) {
	this.queue = kue.createQueue({ redis: config.db });

	if (config.getMode() === 'worker')
		require('./queue-worker.js').init(this.queue, callback);
	else 
		callback();
}

Queue.prototype.enqueue = function (job, callback) {
	var self = this;

	async.parallel({
		active: function (cb) {
			isStatus(self.queue, job.id, 'active', cb);
		},
		inactive: function (cb) {
			isStatus(self.queue, job.id, 'inactive', cb);
		}
	}, function (error, results) {
		if (error || results.active || results.inactive)
			return callback(new Error(error));

		Result.statics.createForJob(job, function (error, result) {
			if (error || !result)
				return callback(new Error(error));

			result.enqueue();
			self.queue.create(job.platform, {
				title: job.name,
				job_id: job.id,
				result_id: result.id,
				master_url: config.getUrl()
			}).save(callback);
		});
	});
};

Queue.prototype.remove = function (job, callback) {
	forEachInQueue(this.queue, ['inactive', 'active'], function (kueJob, done) {
		if (kueJob.data.job_id === job.id) {
			kueJob.remove(function () {
				Result.findById(kueJob.data.result_id, function (error, result) {
					if (error || ! result)
						return done();

					result.interrupt(function () {
						done();
					});
				});	
			});
		}
		else {
			done();
		}
	}, callback);
};

Queue.prototype.shutdown = function (callback) {
	if (!this.queue) return callback();

	if (config.getMode() === 'master') {
		forEachInQueue(this.queue, ['complete', 'failed', 'delayed'], function (job, done) {
			job.remove(function () {
				done();
			});
		}, callback);
	} 
	else if (config.getMode() === 'worker') {
		require('./queue-worker.js').shutdown(callback);
	}
};

module.exports = new Queue();