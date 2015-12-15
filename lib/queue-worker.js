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

//local private logger interceptors to allow us to turn logging on/off at the module level
var qlogging = true;  //if true we create lots of logger.d logging

function qloggerD(aString) {
	if (qlogging) {
		logger.d(aString);
	}

}

function qloggerTrace() {
	if (qlogging){
		logger.trace();
	}
}

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
	qloggerD("QueueWorker.remove 1 id=" + id);
	qloggerTrace();
	var self = this;

	if (self.jobs[id]) {
		qloggerD("QueueWorker.remove 5 found id " + id);
		master.stopWorkers(self.jobs[id].job_id);
		delete self.jobs[id];
		qloggerD("QueueWorker.remove 10: deleting job:" + id);
		kue.Job.get(id, function (error, job) {
			if (error || !job) {
				qloggerD('QueueWorker.remove 20: ERROR getting id:' + id);
				return (callback || function () {})();
			}
			qloggerD("QueueWorker.remove 30 about to set job.complete");
			job.complete(function () {

				qloggerD("QueueWorker.remove 40 job.complete in callback");
				if (callback) {
					qloggerD("QueueWorker.remove 44 invoking callback");
					callback();
				}
				qloggerD("QueueWorker.remove 46 setting nextTick to self.searchQueue()");
				async.nextTick(function () {
					qloggerD("QueueWorker.remove 48 nextTick now invoking self.searchQueue()");
					self.searchQueue();
				});
			});
		});

	}
}

QueueWorker.prototype.searchQueue = function () {
	var self = this;
    qloggerD("QueueWorker.searchQueue entered");
	var lock = require('redis-lock')(self.queue.client);
	lock('kue', function (done) {
		self.queue.inactive(function (error, ids) {
			if (error) {
				qloggerD("QueueWorker:searchQueue 10- Error encountered");
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
			logger.i('QueueWorker.isRunnable ERROR. Received job that is already complete:'+ JSON.stringify(kjob.toJSON()));
			return callback(null, false);
		}

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
	qloggerD("QueueWorker.process 0 for id" + job.id);
	qloggerD(job.toJSON());

	async.series([
		function(cb){
			qloggerD('QueueWorker.process: 0.1 setting removeOnComplete(true)');
			job.removeOnComplete(true).save(cb); //TODO: make this a queue option or an option when the job is created
		},
		function(cb){
			job.active(function (error) {
				qloggerD("QueueWorker.process: 1");
				if (error) {
					qloggerD("QueuWorker process: 1.5- ERROR ERROR. Returning");
					return;
				}
				qloggerD("QueueWorker.process: 2");
				self.jobs[job.id] = job.data;
				self.jobs[job.id].platform = job.type;
				qloggerD("QueueWorker.process: 3-forking worker");
				master.forkWorker(job.data, function () {
					qloggerD("QueueWorker.process: 4-removing id:" + job.id);
					self.remove(job.id);
				});
				cb();
			});
		}
	], function(err, results){
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