/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Reads and validates the master and worker config.json files.
 */

var path = require('path');
var url = require('url');
var utilities = require('./utilities');

function Config () {
	var config;
	var mode = utilities.getMode();
	if (mode === 'master') config = require(path.join(__rootdir, 'config', 'master', 'config.json'));
	else if (mode === 'worker') config = require(path.join(__rootdir, 'config', 'worker', 'config.json'));
	else config = {};

	for (var key in config) {
		this[key] = config[key];
	}
}

function getUrlObj (host, port) {
	if (host.slice(-1) === '/') host = host.slice(0, -1);
	var urlObj = url.parse(host + ':' + port + '/');
	return urlObj;
}

Config.prototype.validate = function () {
	if (!this.host) throw new Error('Config is missing host.');
	if (!this.port) throw new Error('Config is missing port.');
	if (!this.db) throw new Error('Config is missing db.');
	var urlObj = getUrlObj(this.host, this.port);
	if (!(urlObj.protocol && urlObj.port && urlObj.host && urlObj.hostname)) 
		throw new Error('Hostname in config is invalid.');

	var mode = utilities.getMode();
	if (mode === 'master') {
		if (!this.github) throw new Error('Config is missing github.');
		if (!this.github.host) throw new Error('Config is missing github host.');
		if (!this.github.token) throw new Error('Config is missing github token.');
		
		if (!this.mailer) logger.w('Config is missing mailer. Email notifications will not work.');
		else if (!this.mailer.service) logger.w('Config is missing mailer service. Email notifications will not work.');
		else if (!this.mailer.username) logger.w('Config is missing mailer username. Email notifications will not work.');
		else if (!this.mailer.password) logger.w('Config is missing mailer password. Email notifications will not work.');
	}
}

Config.prototype.getUrl = function () {
	var urlObj = getUrlObj(this.host, this.port);
	return urlObj.href;
}

var config = new Config();
config.validate();
module.exports = config;
