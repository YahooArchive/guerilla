/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models and validates a report configuration.
 */

function Report (json) {
	for (var key in json) {
		this[key] = json[key];
	}
}

Report.prototype.validate = function () {
	return true;
};

module.exports = Report;