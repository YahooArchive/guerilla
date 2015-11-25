/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Provides data and functionality to be used by tasks.
 */

var path = require('path');
var callsite = require('callsite');
var Task = require('./task');
var utilities = require('./utilities');

function Context (executor, job, result, device) {
	var self = this;

	self.bin_dir = path.join(__rootdir, 'bin');
	self.output_dir = result.output_dir;
	self.working_dir = job.getWorkingDir();
	if (device) {
		self.device = device;
	}

	var servicesDir = path.join(__rootdir, 'services');
	self.services = {
		AndroidMemoryService: require(servicesDir + '/android-memory'),
		AndroidNetworkService: require(servicesDir + '/android-network'),
		AndroidScreenshotService: require(servicesDir + '/android-screenshot'),
		iOSSystemLogService: require(servicesDir + '/ios-system-log'),
		LogcatService: require(servicesDir + '/logcat'),
		APKToPackageNameService: require(servicesDir + '/apk-to-package-name'),
		AppToBundleIdentifierService: require(servicesDir + '/app-to-bundle-identifier'),
		FinderService: require(servicesDir + '/finder')
	};

	self.log = function (string, callback) {
		result.log.apply(result, ['info', string, callback]);
	};

	self.output = function () {
		return result.data || {};
	};

	self.createReport = function (config) {
		result.addReport(config);
	};

	self.require = function () {
		return require.apply(self, arguments);
	};

	self.exists = function (v) {
		return utilities.exists(v);
	};

	self.runTask = function (config, callback) {
		var task = new Task(config);
		task.params.parent_task = path.basename(callsite()[1].getFileName());
		executor.executeTask(task, function (errors) {
			var error;
			if (errors) error = new Error('Child task failed: ' + task.params.task);
			callback(error);
		});
	};

	self.addPostJobTask = function (config) {
		executor.postJobPhase.tasks.unshift(new Task(config));
	};

	self.previous = function (callback) {
		result.previous(function (error, previousResult) { 
			if (error || !previousResult) return callback(new Error(error));

			var previousContext = new Context(executor, job, previousResult, previousResult.device);
			callback(null, previousContext)
		});
	};
}

module.exports = Context;