/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * A logger class.
 */

var colors = require('colors');
var util = require('util');
var utilities = require('./utilities');
var argv = require('yargs').argv;

function Logger () {
	this.levels = {
		v: 0,
		d: 1,
		i: 2,
		w: 3,
		e: 4
	}

	if (argv.v) this.level = this.levels.v;
	else if (argv.d) this.level = this.levels.d;
	else if (argv.i) this.level = this.levels.i;
	else if (argv.w) this.level = this.levels.w;
	else if (argv.e) this.level = this.levels.e;
	else this.level = 1;
}

function log (color, console_args) {
	try {
		for (var key in console_args) {
			console_args[key] = utilities.stringify(console_args[key]);
			console_args[key] = colors[color](console_args[key]);
		}
		console.log.apply(this, console_args);
	}
	catch (ex) {
		console.log('LOG FAILURE'.red);
	}
}

Logger.prototype.v = function () {
	if (this.level <= this.levels.v)
		log('cyan', arguments);
};

Logger.prototype.d = function () {
	if (this.level <= this.levels.d)
		log('magenta', arguments);
};

Logger.prototype.i = function () {
	if (this.level <= this.levels.i)
		log('green', arguments);
};

Logger.prototype.w = function () {
	if (this.level <= this.levels.w)
		log('yellow', arguments);
};

Logger.prototype.e = function () {
	if (this.level <= this.levels.e)
		log('red', arguments);
};

Logger.prototype.trace = function() {
	if (this.level <= this.levels.d) {
		console.trace();
	}
}

module.exports = new Logger();