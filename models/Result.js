/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models the results from an individual job run.
 */

var moment = require('moment');
var path = require('path');
var util = require('util');
var async = require('async');
var fs = require('fs-extra');
var utilities = require(path.join(__rootdir, 'lib', 'utilities'));

var Result;

module.exports.init = function (db) {
	if (Result) return;

	Result = db.define('Result', {
		number: { type: Number, index: true },
		worker_name: String,
		worker_url: String,
		git_sha: String,
		device: db.JSON,
		queued: Date,
		queue_time: Number,
		started: Date,
		run_time: Number,
		finished: Date,
		status: { type: String, default: 'inconclusive', index: true },
		output_dir: String,
		pipeline: db.JSON,
		data: db.JSON,
		reports: db.JSON,
		error_messages: db.JSON,
		notes: String
	});

	Result.validatesPresenceOf('number');
	Result.validatesInclusionOf('status', { in: ['success', 'failure', 'inconclusive', 'running', 'queued'] });

	Result.statics = {
		createForJob: function (job, callback) {
			job.results(function (error, results) {
				if (error)
					return callback(error);

				var result = new Result();
				result.job_id = job.id;
				result.number = results.length + 1;
				result.pipeline = [];
				result.data = {};
				result.reports = [];
				result.error_messages = [];
				result.git_sha = git_sha;

				result.save(callback);
			});
		},
		findByJobIdAndNumber: function (job_id, number, callback) {
			if (number === 'last') {
				this.getLast(job_id, callback);
			} else if (number === 'current') {
				this.getCurrent(job_id, callback);
			} else {
				Result.findOne()
					.where('job_id', job_id)
					.where('number', number)
					.run(callback);
			}
		},
		getLast: function (job_id, callback) {
			Result.findOne()
				.where('job_id', job_id)
				.sort('-number')
                .where('status').nin(['queued', 'running'])
                .run(callback);
        },
		getCurrent: function (job_id, callback) {
			Result.findOne()
				.where('job_id', job_id)
				.sort('-number')
				.run(callback);
		}
	};

	Result.prototype.log = function (tag, string, callback) {
		callback = callback || function (error) { if (error) logger.e(error) };
		string = String(string);

		try {
			if (this.output_dir) {
				var logString = '[' + moment().format('M/D/YY h:mm:ss A') + '] [' + tag.toUpperCase() + '] ' + string.trim() + '\n';
				logger.v(logString);
				fs.appendFile(path.join(this.output_dir, 'console-log.txt'), logString, function (error) {
					if (callback) callback(error);
				});
			}
			else {
				if (callback) callback(new Error('Cannot log, output_dir not set.'));
			}
		}
		catch (ex) {
			callback(new Error('Error logging.'));
		}
	};

	Result.prototype.addPhase = function (phase, callback) {
		if (phase)
			this.pipeline.push(phase.toJSON());
		this.save(callback);
	};

	Result.prototype.addError = function (error, callback) {
		if (error) {
			this.error_messages.push(error.message || error.toString());
			this.log('error', error.stack || error.toString());
		}
		this.save(callback);
	};

	Result.prototype.addData = function (data, callback) {
		if (utilities.isDictionary(data)) {
			for (var key in data) {
				if (utilities.exists(data[key])) this.data[key] = data[key];
			}
		}

		this.save(callback);
	};

	Result.prototype.addReport = function (config, callback) {
		if (config)
			this.reports.push(config);
		this.save(callback);
	};

	Result.prototype.enqueue = function (callback) {
		this.status = 'queued';
		this.queued = new Date();
		this.save(callback);
	};

	Result.prototype.start = function (callback) {
		var self = this;

		fs.mkdirs(self.output_dir, function (error) {
			self.status = 'running';
			self.started = new Date();
			self.queue_time = self.started - self.queued;
			self.save(function (err) {
				if (error || err) return callback(error || err);
				callback(null, self);
			});
		});
	};

	Result.prototype.interrupt = function (callback) {
		var self = this;

		async.series([
			function (cb) {
				self.addError('Job was interrupted.', cb);
			},
			function (cb) {
				self.status = 'inconclusive';
				self.finished = new Date();
				self.run_time = self.finished - self.started;
				self.save(cb);
			}
		], callback);
	};

	Result.prototype.finish = function (error, callback) {
		var self = this;

		async.series([
			function (cb) {
				if (error) return self.addError(error, cb);
				cb();
			},
			function (cb) {
				if (self.error_messages.length > 0)
					self.status = 'failure';
				else
					self.status = 'success';

				self.finished = new Date();
				self.run_time = self.finished - self.started;
				self.save(cb);
			}
		], callback);
	};

	Result.prototype.previous = function (callback) {
		if (this.number === 1) return callback(new Error('No previous results exist.'));
		Result.statics.findByJobIdAndNumber(this.job_id, this.number - 1, callback);
	};
};
