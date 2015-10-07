/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * A collection of tasks.
 */

function Phase (name, tasks) {
	this.name = name;
	this.tasks = tasks || [];
}

Phase.prototype.toJSON = function () {
	var json = {
		name: this.name,
		tasks: []
	};
	
	this.tasks.forEach(function (task) {
		json.tasks.push(task.toJSON());
	});

	return json;
}

module.exports = Phase;