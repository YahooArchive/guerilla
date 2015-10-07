/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Task runner for javascript type tasks.
 */

var path = require('path');
var _ = require('underscore');

function requireTask (params, context, callback) {
	var file;

	if (params.task) {
		file = path.join(__dirname, 'javascript', params.task);
	}
	else if (params.custom_task) {
		if (context.project_root) 
			file = path.join(context.project_root, params.custom_task);
		else 
			return callback(new Error('Cannot run custom_task ' + params.custom_task + ' because project_root is not set in context.'));
	}
	else {
		return callback(new Error('task or custom_task is required'));
	}

	try {
		var task = require(file);
		callback(null, task);
	}
	catch (ex) {
		callback(ex);
	}
}

module.exports.validate = function validate (params, context, callback) {
	requireTask(params, context, function (error, task) {
		if (error) return callback(error);
		if (!task.validate) return callback();

		var vschema = task.validate();
		var pschema = vschema.params || {};
		var cschema = vschema.context || {};

		function checkKey (key, schema, obj) {
			var value = schema[key];

			if (_.isFunction(value)) 
				return value(params, context);
			else if (value === 'required') 
				return (context.exists(obj[key])) ? true : false;
			else if (value === 'optional') 
				return true;
			else
				return false;
		}

		var errors = [];

		for (var key in pschema) {
			if (!checkKey(key, pschema, params)) 
				errors.push(new Error('Invalid params: ' + key + ' failed validation: ' + pschema[key]));
		}

		for (var key in cschema) {
			if (!checkKey(key, cschema, context)) 
				errors.push(new Error('Invalid context: ' + key + ' failed validation: ' + cschema[key]));
		}

		return callback((errors.length > 0) ? errors : null);
	});
};

module.exports.execute = function execute (params, context, exec, callback) {
	requireTask(params, context, function (error, task) {
		if (error) return callback(error);
		if (!task.execute) return callback();
		task.execute(params, context, exec, callback);
	});
};

module.exports.verify = function verify (params, output, context, exec, callback) {
	requireTask(params, context, function (error, task) {
		if (error) return callback(error);
		if (!task.verify) return callback();
		task.verify(params, output, context, exec, callback);
	});
};