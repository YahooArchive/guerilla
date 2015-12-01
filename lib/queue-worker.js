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
var log = require('log4js').getLogger('queue-worker');
var master = require('./job-master');
var deviceManager = require('./device-manager');
var Job = require('./db').models().Job;


function QueueWorker () {
	this.jobs = {};
}

QueueWorker.prototype.init = function (queue, callback) {
	var self = this;
	self.queue = queue;
	self.searchQueue(); //TODO:bruceg move after self.queue.on below so we don't miss any events?

	self.queue.on('job enqueue', function (id, type) {
		self.searchQueue();
	});

	self.queue.on('job remove', function (id, type) {
		self.remove(id);
	});

	callback();
}

QueueWorker.prototype.remove = function (id, callback) {
	log.info("UUUUU an info QueueWorker.remove");
	log.trace('QueueWorker.remove 1 id=' + id);
	var self = this;

	if (self.jobs[id]) {
		log.trace('QueueWorker.remove 5 found id ' + id);
		master.stopWorkers(self.jobs[id].job_id);
		delete self.jobs[id];
		log.trace('QueueWorker.remove 10: deleting job:' + id);
		kue.Job.get(id, function (error, job) {
			if (error || !job) {
				log.debug('QueueWorker.remove 20: ERROR getting id:' + id);
				return (callback || function () {})();
			}
			log.trace('QueueWorker.remove 30 about to set job.complete');
			job.remove(function (err) {
				log.trace('QueueWorker.remove 35 err=' + err);
				log.trace('QueueWorker.remove 40 job.complete in callback');
				if (callback) {
					log.trace('QueueWorker.remove 44 invoking callback');
					callback();
				}
				log.trace('QueueWorker.remove 46 setting nextTick to self.searchQueue()');
				async.nextTick(function () {
					log.trace('QueueWorker.remove 48 nextTick now invoking self.searchQueue()');
					self.searchQueue();
				});
			});
		});

	}
}

QueueWorker.prototype.searchQueue = function () {
	var self = this;
	log.trace('QueueWorker.searchQueue entered');
	var lock = require('redis-lock')(self.queue.client);
	lock('kue', function (done) {
		self.queue.inactive(function (error, ids) {
			if (error) {
				log.debug('QueueWorker:searchQueue 10- Error encountered');
				return done();
			}
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

		if (kjob.state()==='complete') {
			log.warn('QueueWorker.isRunnable Warning. Received job that is already complete:'+ JSON.stringify(kjob.toJSON()));
			return callback(null, false);
		}

		Job.findById(kjob.data.job_id, function (error, job) {
			if (error || !job) return callback(null, false);


			//if we are already running a job for kjob.type then the job is not runnable.
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
	log.trace('QueueWorker.process 0 for id' + job.id);
	log.trace(job.toJSON());


	job.active(function (error) {
		log.trace('QueueWorker.process: 1 for job:' + job.id);
		if (error) {
			log.warn('QueueWorker.process job.active returned error' + error);
			return callback(error);
		}
		log.trace('QueueWorker.process: 2');
		self.jobs[job.id] = job.data;
		self.jobs[job.id].platform = job.type;
		log.trace('QueueWorker.process: 3-forking worker');
		master.forkWorker(job.data, function () {
			log.trace('QueueWorker.process: 4-removing id:' + job.id);
			self.remove(job.id);
		});
		callback();
	});
}

QueueWorker.prototype.shutdown = function (callback) {
	log.trace('QueueWorker.shutdown entered');
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