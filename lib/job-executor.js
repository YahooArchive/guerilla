/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Executes a job for a given result on the specified device.
 */

var fs = require('fs-extra');
var path = require('path');
var async = require('async');
var childProcess = require('child_process');
var jobBuilder = require('./job-builder');
var Phase = require('./phase');
var Context = require('./context');

function JobExecutor (job, result, device) {
	var self = this;
	self.job = job;
	self.result = result;
	self.device = device;
	self.result.device = self.device;
	self.context = new Context(self, self.job, self.result, self.device);
	self.phases = jobBuilder.buildPhases(self.job);
	self.postJobPhase = self.phases.pop();
}

JobExecutor.prototype.executePhase = function (phase, ignoreErrors, callback) {
	if (!callback) {
		callback = ignoreErrors;
		ignoreErrors = false;
	}

	var self = this;

	self.summaryPhase = new Phase(phase.name);
	async.eachSeries(phase.tasks, function (task, cb) {
		self.executeTask(task, ignoreErrors, cb);
	}, function (error) {
		self.result.addPhase(self.summaryPhase);
		callback(error);
	});
}

JobExecutor.prototype.executeTask = function (task, ignoreErrors, callback) {
	if (!callback) {
		callback = ignoreErrors;
		ignoreErrors = false;
	}

	var self = this;

	function execFn () {
		return exec.apply(self, arguments);
	}

	function onTaskComplete (errors, output) {
		if (ignoreErrors) errors = null;
		else async.each(errors, self.result.addError.bind(self.result));
		
		if (output) self.result.addData(output);
		return errors;
	}

	task.run(self.context, execFn, function () {
		if (self.summaryPhase) self.summaryPhase.tasks.push(task);
		callback(onTaskComplete.apply(self, arguments));
	});
}

JobExecutor.prototype.execute = function (done) {
	var self = this;

	async.eachSeries(self.phases, function (phase, cb) {
		self.executePhase(phase, cb);
	}, function () {
		self.executePhase(self.postJobPhase, true, done);
	});
}

function getExecString (cmd, args, options) {
	var str = cmd;
	var cwd = options.cwd || __dirname;
	args.forEach(function (arg) { 
		str += ' ' + arg; 
	});
	str = 'cd ' + cwd + ' && ' + str;
	return str;
}

function getLogFunction (options, log) {
	if (options === 'none') return function () {};
	if (Array.isArray(options)) {
		var stdin = (options[0] === false) ? false : true;
		var stdout = (options[1] === false) ? false : true;
		var stderr = (options[2] === false) ? false : true;
		var exit = (options[3] === false) ? false : true;

		return function (tag, str) {
			if (tag === 'stdin' && stdin) log(tag, str);
			else if (tag === 'stdout' && stdout) log(tag, str);
			else if (tag === 'stderr' && stderr) log(tag, str);
			else if (tag === 'exit' && exit) log(tag, str);
		}
	}
	return log;
}

function exec (cmd, args, options, callback) {
	var self = this;

	var log = getLogFunction(options.log, function (tag, str) {
		self.result.log.apply(self.result, [tag, str]);
	});

	var p;
	var errorMsg;
	
	try {
		p = childProcess.spawn(cmd, args, options);
	}
	catch (ex) {
		return callback(new Error(ex));
	}

	var cmdString = getExecString(cmd, args,  options);
	log('stdin', cmdString);

	if (options.file) {
		var stream = fs.createWriteStream(options.file);
		p.stdout.pipe(stream);
		p.stderr.pipe(stream);
	}

	var timeout;
	if (options.timeout && options.timeout > 0) {
		timeout = setTimeout(function () {
			errorMsg = 'Timed out after ' + options.timeout + ' seconds: ' + cmdString;
			p.kill();
		}, options.timeout * 1000);
	}

	p.stdout.on('data', function (buffer) {
		var data = buffer.toString();
		if (options.stdout) options.stdout(data);
		log('stdout', data);
	});

	p.stderr.on('data', function (buffer) {
		var data = buffer.toString();
		if (options.stderr) options.stderr(data);
		log('stderr', data);
	});

	p.on('exit', function (code, signal) {
		clearTimeout(timeout);

		if (code !== 0) {
			var msg = errorMsg || 'Received exit code: ' + code + ' & signal: ' + signal + ': ' + cmdString;
			log('exit', msg);
			
			var error = new Error(msg);
			error.code = code;
			error.signal = signal;
			return callback(error);
		}
		
		callback();
	});

	p.on('error', function (error) {
		callback(new Error(error));
	});

	return p;
}

module.exports = JobExecutor;