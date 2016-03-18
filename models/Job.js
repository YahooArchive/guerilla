/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models a configured job.
 */

import utilities from './utilities';

var async = require('async');
var path = require('path');
var childProcess = require('child_process');
var config = require(path.join(__rootdir, 'lib', 'config'));
var Report = require(path.join(__rootdir, 'lib', 'report'));

var Job;

module.exports.init = function (db) {
	if (Job) return;

	Job = db.define('Job', {
		name: String,
		platform: String,
		valid: { type: Boolean, default: true },
		validation_error: String,
		enabled: { type: Boolean, default: true },
		cron_time: String,
		device_tag: String,
		notify: db.JSON,
		timeout: { type: Number, default: 1 * 60 * 60 },
		checkout: db.JSON,
		compile: db.JSON,
		tests: db.JSON,
		reports: db.JSON
	});

	var Project = db.models.Project;
	var Result = db.models.Result;
	var ConfigLocation = db.models.ConfigLocation;

	Job.hasMany(Result, { as: 'results', foreignKey: 'job_id' });
	Job.belongsTo(Project, { as: 'project', foreignKey: 'project_id' });
	Job.belongsTo(ConfigLocation, { as: 'config_location', foreignKey: 'config_location_id' });

	Job.validate('name', function (err) {
		if (!this.valid) return;
		if (!utilities.exists(this.name)) return err();
	}, { message: 'Name is required.' });

	Job.validate('platform', function (err) {
		if (!this.valid) return;
		if (!utilities.exists(this.platform)) return err();
	}, { message: 'Platform is required.' });

	Job.validate('platform', function (err) {
		if (!this.valid) return;
		if (['android', 'ios'].indexOf(this.platform) < 0) return err();
	}, { message: 'Platform must be android or ios.' });

	Job.validate('checkout', function (err) {
		if (!this.valid) return;
		if (!utilities.exists(this.checkout)) return err();
	}, { message: 'Checkout is required.' });

	Job.validate('compile', function (err) {
		if (!this.valid) return;
		if (!utilities.exists(this.compile)) return err();
	}, { message: 'Compile is required.' });

	Job.validate('tests', function (err) {
		if (!this.valid) return;
		if (!utilities.exists(this.tests)) return err();
	}, { message: 'Tests is required.' });

	Job.validate('reports', function (err) {
		if (!this.valid) return;
		if (this.reports && !Array.isArray(this.reports))
			return err();
	}, { message: 'Must be array.' });

	Job.validate('reports', function (err) {
		if (!this.valid) return;
		if (this.reports && Array.isArray(this.reports)) {
			this.reports.some(function (config) {
				var report = new Report(config);
				if (!report.validate()) {
					err();
					return true;
				}
			});
		}
	}, { message: 'Invalid config.' });

	Job.afterSave = function (next) {
		this.schedule();
		next();
	};

	Job.beforeDestroy = function (next) {
		this.stop(function () {
			next();
		});
	};

	Job.afterDestroy = function (next) {
		this.results(function (error, results) {
			if (error || !results) return;
			async.each(results, function (result, cb) {
				result.destroy(function () {
					cb();
				});
			});
		});

		this.config_location(function (error, configLocation) {
			if (error || !configLocation) return;
			configLocation.destroy(function () {});
		});

		next();
	};

	Job.statics = {
		createWithJSON: function (json, callback) {
			var job = new Job(json);
			job.save(function (error, job) {
				if (!error) return callback(null, job);
				job.valid = false;
				job.validation_error = job.errors;
				job.save(callback);
			});
		},
		populateById: function (job_id, callback) {
			Job.findById(job_id, function (error, job) {
				if (error || !job) return callback(new Error(error));
				job.populate(callback);
			});
		},
		findByProjectId: function (project_id, callback) {
			Job.find().where('project_id', project_id).run({}, callback);
		},
		findByConfigLocationId: function (config_location_id, callback) {
			Job.findOne().where('config_location_id', config_location_id).run({}, callback);
		}
	};

	Job.prototype.populate = function (callback) {
		var self = this;
		var jobJSON = self.toJSON();

		async.parallel([
			self.project.bind(self),
			self.getResults.bind(self),
			self.config_location.bind(self)
		], function (error, results) {
			jobJSON.project = results[0];
			jobJSON.results = results[1];
			jobJSON.config_location = results[2];

			if (!jobJSON.reports)
				jobJSON.reports = [];
			jobJSON.reports.unshift(self.getDefaultReport());

			callback(null, jobJSON);
		});
	};

	Job.prototype.edit = function (json, callback) {
		json.id = this.id;

		var job = new Job(json);
		job.save(function (error, job) {
			if (!error) return callback(null, job);
			job.valid = false;
			job.validation_error = job.errors;
			job.save(callback);
		});
	};

	Job.prototype.getResults = function (statuses, callback) {
		if (!callback) {
			callback = statuses;
			statuses = null;
		}

		var query = Result.find().where('job_id', this.id);
		if (statuses) query.in('status', statuses);
		query.asc('number').run({}, callback);
	};

	Job.prototype.getDefaultReport = function () {
		return new Report({
			title: 'Results',
			type: 'table',
			series: [
				'number',
				'started',
				'run_time',
				'version'
			]
		});
	};

	Job.prototype.getWorkingDir = function () {
		return path.join(config.getTempDir(), this.id.toString());
	};

	Job.prototype.enqueue = function (callback) {
		var self = this;

		self.config_location(function (error, configLocation) {
			if (error || !configLocation) return callback(new Error(error));

			configLocation.upsertJob(function (error, job) {
				if (error || !job) return callback(new Error(error));
				if (!job.valid) return callback(new Error('Job is not valid.'));

				var queue = require(path.join(__rootdir, 'lib', 'queue'));
				queue.enqueue(self, callback);
			});
		});
	};

	Job.prototype.stop = function (callback) {
		var queue = require(path.join(__rootdir, 'lib', 'queue'));
		queue.remove(this, callback);
	};

	Job.prototype.schedule = function () {
		var scheduler = require(path.join(__rootdir, 'lib', 'scheduler'));
		scheduler.schedule(this);
	};

	Job.prototype.sendMail = function (url, result, callback) {
		if (this.notify && this.notify.length > 0) {
			var mailer = require(path.join(__rootdir, 'lib', 'mailer'));
			mailer.sendJobResultMail(url, this, result, callback);
		}
		else {
			callback();
		}
	};
};