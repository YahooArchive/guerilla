/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Utility and helper functions used across the application.
 */

var path = require('path');
var util = require('util');
var argv = require('yargs').argv;

function Utilities () {
}

Utilities.prototype.getMode = function () {
	if (argv.master) return 'master';
	else if (argv.worker) return 'worker';
	else throw new Error('Invalid mode.');
}

Utilities.prototype.expandTilde = function (path) {
	var join = require('path').join;
	var homedir = process.env['HOME'];
	if (!path) return path;
	if (path == '~') return homedir;
	if (path.slice(0, 2) != '~/') return path;
	return join(homedir, path.slice(2));
}

Utilities.prototype.getGuerillaDir = function () {
	return this.expandTilde('~/Guerilla');
}

Utilities.prototype.getResultsDir = function () {
	return path.join(this.getGuerillaDir(), 'Results');
}

Utilities.prototype.getUploadsDir = function () {
	return path.join(this.getGuerillaDir(), 'Uploads');
}

Utilities.prototype.getTempDir = function () {
	return path.join(this.getGuerillaDir(), 'Temp');
}

Utilities.prototype.formatMilliseconds = function (ms) {
	var secNum = parseInt(ms / 1000, 10);
    var hours = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);
    var seconds = secNum - (hours * 3600) - (minutes * 60);

    if (minutes < 10) 
    	minutes = '0' + minutes;
    if (seconds < 10) 
    	seconds = '0' + seconds;

    var time = hours + ':' + minutes + ':' + seconds;
    return time;
}

Utilities.prototype.isDictionary = function (obj) {
	return !(!obj || Array.isArray(obj) || obj.constructor != Object);
}

Utilities.prototype.exists = function (v) {
	return !(typeof v == 'undefined' || v == null);
}

Utilities.prototype.stringify = function (obj) {
	if (typeof obj === 'object') 
		return util.inspect(obj, { showHidden: true, depth: null });
	else
		return obj;
}

module.exports = new Utilities();
