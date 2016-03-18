/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models a collection of jobs.
 */

import utilities from './utilities';

var async = require('async');
var path = require('path');

var Project;

module.exports.init = function (db) {
	if (Project) return;

	Project = db.define('Project', {
		name: String
	});

	Project.validatesPresenceOf('name');

	Project.afterDestroy = function (next) {
		this.jobs(function (error, jobs) {
			if (error || !jobs) return;
			async.each(jobs, function (job, cb) {
				job.destroy(function () {
					cb();
				});
			});
		});

		next();
	};

	Project.statics = {
		createWithJSON: function (json, callback) {
			var project = new Project(json);
			project.save(callback);
		},
		populateById: function (project_id, callback) {
			Project.findById(project_id, function (error, project) {
				if (error || !project) return callback(new Error(error));
				project.populate(callback);
			});
		},
		populateAll: function (callback) {
			var projects = [];

			async.waterfall([
				function (cb) {
					Project.all(cb);
				},
				function (projs, cb) {
					if (projs.length === 0) 
						return cb();

					async.each(projs, function (project, fn) {
						project.populate(function (error, projectJSON) {
							if (!error && utilities.exists(projectJSON))
								projects.push(projectJSON);
							fn();
						});
					}, cb);
				}
			], function (error) {
				callback(error, projects)
			});
		}
	};

	Project.prototype.populate = function (callback) {
		var self = this;

		var projectJSON = self.toJSON();

		self.jobs(function (error, jobs) {
			if (error || !jobs) return callback(new Error(error));

			projectJSON.jobs = [];
			async.each(jobs, function (job, cb) {
				job.populate(function (error, jobJSON) {
					if (error || !jobJSON) return cb();

					jobJSON.results = jobJSON.results.slice(-5);
					projectJSON.jobs.push(jobJSON);
					cb();
				});
			}, function () {
				callback(null, projectJSON);
			});
		});
	};

	Project.prototype.edit = function (json, callback) {
		this.name = json.name;
		this.save(callback);
	};

	Project.prototype.jobs = function (callback) {
		var Job = db.models.Job;
		Job.statics.findByProjectId(this.id, callback);
	};
};

