/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Listens for queue events and selects runnable jobs from queue as capacity becomes available.
 */

var async = require('async');
var path = require('path');
var kue = require('kue');
var master = require('./job-master');
var deviceManager = require('./device-manager');
var Job = require('./db').models().Job;

function QueueWorker () {
	this.jobs = {};
}

QueueWorker.prototype.init = function (queue, callback) {
	var self = this;
	self.queue = queue;
	self.searchQueue();

	self.queue.on('job enqueue', function (id, type) {
		self.searchQueue();
	});

	self.queue.on('job remove', function (id, type) {
		self.remove(id);
	});

	callback();
}

QueueWorker.prototype.remove = function (id, callback) {
	config.log("QueueWorker.remove id=" + id);
	var self = this;

	if (self.jobs[id]) {
		config.log("QueueWorker: found id " + id);
		master.stopWorkers(self.jobs[id].job_id);
		delete self.jobs[id];
		config.log("QueueWorker: deleted job:" + id");
		kue.Job.get(id, function (error, job) {
			if (error || !job) return (callback || function () {})();
			job.complete(function () {
				if (callback) callback();
			});
		});
		self.searchQueue();
	}
}

QueueWorker.prototype.searchQueue = function () {
	var self = this;

	var lock = require('redis-lock')(self.queue.client);
	lock('kue', function (done) {
		self.queue.inactive(function (error, ids) {
			if (error) return done();
			async.eachSeries(ids, function (id, cb) {
				self.isRunnable(id, function (error, runnable, job) {
					if (runnable) self.process(job, cb);
					else cb();
				});
			}, done);	
		});
	});
}

QueueWorker.prototype.isRunnable = function (id, callback) {
	var self = this;

	kue.Job.get(id, function (error, kjob) {
		if (error || !kjob) return callback(null, false);

		Job.findById(kjob.data.job_id, function (error, job) {
			if (error || !job) return callback(null, false);

			for (var key in self.jobs) {
				var platform = self.jobs[key].platform;
				if (platform === kjob.type) return callback(null, false, kjob);
			}

			if (!job.device_tag) return callback(null, true, kjob);
			if (!deviceManager.findByTag(job.device_tag)) return callback(null, false, kjob);

			callback(null, true, kjob);
		});
	});
}

QueueWorker.prototype.process = function (job, callback) {
	var self = this;
	config.log("QueueWorker.process for id" + job.id);

	job.active(function (error) {
		config.log("QueueWorker.process: 1");
		if (error) return;
		config.log("QueueWorker.process: 2");
		self.jobs[job.id] = job.data;
		self.jobs[job.id].platform = job.type;
		config.log("QueueWorker.process: 3-forking worker");
		master.forkWorker(job.data, function () {
			config.log("QueueWorker.process: 4-removing id:" + job.id);
			self.remove(job.id);
		});

		callback();
	});
}

QueueWorker.prototype.shutdown = function (callback) {
	var self = this;

	var ids = [];
	for (var id in self.jobs) {
		ids.push(id);
	}

	async.each(ids, function (id, cb) {
		self.remove(id, cb);
	}, callback);
}

QueueWorker.prototype.activeJobs = function () {
	var activeJobs = [];
	for (var id in (this.jobs || {})) {
		activeJobs.push(this.jobs[id]);
	}
	return activeJobs;
}

module.exports = new QueueWorker();