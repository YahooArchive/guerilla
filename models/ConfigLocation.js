/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models the location in GitHub of a job configuration file.
 */

var path = require('path');

var ConfigLocation;

module.exports.init = function (db) {
	if (ConfigLocation) return;

	ConfigLocation = db.define('ConfigLocation', {
		user: String,
		repo: String,
		path: String,
		ref: String
	});

	var Project = db.models.Project;
	ConfigLocation.belongsTo(Project, { as: 'project', foreignKey: 'project_id' });

	ConfigLocation.validatesPresenceOf('user', 'repo', 'path');

	ConfigLocation.afterSave = function (next) {
		this.upsertJob(next);
	};

	ConfigLocation.statics = {
		createWithJSON: function (json, callback) {
			var configLocation = new ConfigLocation(json);
			configLocation.save(callback);
		},
		findByJobId: function (job_id, callback) {
			var Job = db.models.Job;
			Job.findById(job_id, function (error, job) {
				if (error || !job) return callback(new Error(error));
				job.config_location(callback);
			});
		}
	};

	ConfigLocation.prototype.edit = function (json, callback) {
		json.id = this.id;
		json.project_id = this.project_id;

		var configLocation = new ConfigLocation(json);
		configLocation.save(callback);
	};

	ConfigLocation.prototype.fetch = function (callback) {
		var githubClient = require(path.join(__rootdir, 'lib', 'github-client'));
		githubClient.getFile(this.user, this.repo, this.path, this.ref, callback);
	};

	ConfigLocation.prototype.upsertJob = function (callback) {
		var self = this;
		var Job = db.models.Job;

		Job.statics.findByConfigLocationId(self.id, function (error, job) {
			if (error) return callback(error);

			self.fetch(function (error, raw) {
				var json = {};

				if (error) {
					json.valid = false;
					json.validation_error = 'Error fetching job config.';
				}
				else {
					try { 
						json = JSON.parse(raw.trim()); 
					}
					catch (ex) {
						json.valid = false;
						json.validation_error = 'Could not parse job config.';
					}
				}

				json.config_location_id = self.id;
				json.project_id = self.project_id;
				
				if (!job) Job.statics.createWithJSON(json, callback);
				else job.edit(json, callback);
			});
		});
	};
};