/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Takes a job model object (job configuration) and builds a pipeline of phase objects.
 */

var Phase = require('./phase');
var Task = require('./task');

function JobBuilder () {

}

JobBuilder.prototype.buildPhases = function (job) {
	var phases = {};

	phases = [
		buildPreJobPhase(job),
		buildCheckoutPhase(job),
		buildCompilePhase(job),
		buildTestPhase(job),
		buildPostJobPhase(job)
	];

	return phases;
}

function buildPreJobPhase (job) {
	var tasks = [];

	tasks.push(new Task({ type: 'javascript', task: 'clean' }));

	var phase = new Phase('Pre-Job', tasks);
	return phase;
}

function buildCheckoutPhase (job) {
	var tasks = [];

	if (job.checkout.type === 'bash' || job.checkout.type === 'javascript')
		tasks.push(new Task(job.checkout));

	var phase = new Phase('Checkout', tasks);
	return phase;
}

function buildCompilePhase (job) {
	var tasks = [];

	if (job.compile.type === 'bash' || job.compile.type === 'javascript')
		tasks.push(new Task(job.compile));

	var phase = new Phase('Compile', tasks);
	return phase;
}

function buildTestPhase (job) {
	var tasks = [];

	job.tests.forEach(function (task) {
		if (task.type === 'bash' || task.type === 'javascript')
			tasks.push(new Task(task));
	});

	var phase = new Phase('Test', tasks);
	return phase;
}

function buildPostJobPhase (job) {
	var tasks = [];

	// tasks.push(new Task({ type: 'javascript', task: 'clean' }));
	tasks.push(new Task({ type: 'javascript', task: 'zip-results' }));

	var phase = new Phase('Post-Job', tasks);
	return phase;
}

module.exports = new JobBuilder();