/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Forks and manages isolated process for each running job.
 */

var path = require('path');
var async = require('async');
var cp = require('child_process');
var Job = require('./db').models().Job;

function JobMaster () {
	this.workers = {};
}

JobMaster.prototype.forkWorker = function (data, callback) {
	var self = this;
	var job_id = data.job_id;

	Job.findById(job_id, function (error, job) {
		if (error || !job) 
			return callback(new Error(error));

		var args = [];
		for (var key in data) {
			args.push('--' + key, data[key]);
		}

		var worker = cp.fork(
			path.join(__dirname, './job-worker'), 
			args.concat(process.argv.slice(2))
		);

		if (!self.workers[job_id])
			self.workers[job_id] = [];
		self.workers[job_id].push(worker);
		
		var timeout = setTimeout(function () {
			worker.kill();
		}, job.timeout * 1000);

		worker.on('exit', function (code, signal) {
			clearTimeout(timeout);
			self.stopWorkers(job_id);
			callback();
		});
	});
}

JobMaster.prototype.stopWorkers = function (job_id) {
	if (this.workers[job_id]) {
		this.workers[job_id].forEach(function (worker) {
			try { worker.kill('SIGINT'); }
			catch (ex) {}
		});
	}
	delete this.workers[job_id];
}

module.exports = new JobMaster();