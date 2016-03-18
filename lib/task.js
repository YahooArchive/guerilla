/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * An abstraction of a task.
 */

import utilities from './utilities';

var path = require('path');
var async = require('async');

function Task (params) {
	this.errors = [];
	this.output = {};
	this.params = params || {};
}

Task.prototype.run = function (context, exec, callback) {
	var self = this;
	async.series([
		function (cb) {
			self.validate(context, exec, cb);
		},
		function (cb) {
			self.execute(context, exec, cb);
		},
		function (cb) {
			self.verify(context, exec, cb);
		}
	], function (error) {
		callback(error, self.output);
	});
};

function process (self, fn, args, cb) {
	var guard = false;

	function callback () {
		if (!guard) {
			guard = true;
			cb.apply(this, arguments);
		}
	}

	args.push(function (error, output) {
		self.addError(error);
		self.addOutput(output);
		callback((self.errors.length > 0) ? self.errors : null);
	});

	require(path.join(__rootdir, 'tasks', self.params.type))[fn].apply(self, args);
}

Task.prototype.validate = function (context, exec, callback) {
	if (['javascript', 'bash', 'none'].indexOf(this.params.type) < 0) 
		return callback(new Error('Invalid task type: ' + this.params.type));

	var args = [this.params, context];
	process(this, 'validate', args, callback);
};

Task.prototype.execute = function (context, exec, callback) {
	var args = [this.params, context, exec];
	process(this, 'execute', args, callback);
};

Task.prototype.verify = function (context, exec, callback) {
	var p = Object.create(this.params);
	if (!p.verify) p.verify = {};
	var args = [p, this.output, context, exec];
	process(this, 'verify', args, callback);
};

Task.prototype.addOutput = function (output) {
	if (utilities.isDictionary(output)) {
		for (var key in output) {
			if (utilities.exists(output[key])) this.output[key] = output[key];
		}
	}
};

Task.prototype.addError = function (error) {
	var errors = [];
	if (Array.isArray(error)) {
		error.forEach(function (e) {
			if (e) errors.push(e);
		})
	}
	else if (error) {
		errors.push(error);
	}

	this.errors = this.errors.concat(errors);
};

Task.prototype.toJSON = function () {
	var json = {
		params: this.params,
	};
	if (this.output) 
		json.output = this.output;
	if (this.errors) {
		json.errors = [];
		this.errors.forEach(function (error) {
			if (error) json.errors.push(error.stack || error.toString());
		});
	}

	return json;
};

module.exports = Task;