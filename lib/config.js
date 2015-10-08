/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Reads and validates the master and worker config.json files.
 */

var mkdirp = require("mkdirp");
var fs = require('fs');
var path = require('path');
var url = require('url');
var argv = require('yargs').argv;

function Config () {
	var config;
	var mode = this.getMode();
	if (mode === 'master') config = require(path.join(__rootdir, 'config', 'master', 'config.json'));
	else if (mode === 'worker') config = require(path.join(__rootdir, 'config', 'worker', 'config.json'));
	else config = {};

	for (var key in config) {
		this[key] = config[key];
	}
	
	if (mode === 'worker'){
		if (!this.output_root_dir) {
			this.output_root_dir = '~/Guerilla';
		}
		this.output_root_dir = this.expandTilde(this.output_root_dir);
		mkdirp.sync(this.output_root_dir);
	}

}


function getUrlObj (host, port) {
	if (host.slice(-1) === '/') host = host.slice(0, -1);
	var urlObj = url.parse(host + ':' + port + '/');
	return urlObj;
}

Config.prototype.getMode = function () {
	if (argv.master) return 'master';
	else if (argv.worker) return 'worker';
	else throw new Error('Invalid mode.');
}


Config.prototype.expandTilde = function (apath) {
	var homedir = process.env['HOME'];
	if (!apath) return apath;
	if (apath == '~') return homedir;
	if (apath.slice(0, 2) != '~/') return apath;
	return path.join(homedir, apath.slice(2));
}

Config.prototype.getGuerillaDir = function () {
	return this.output_root_dir;
}

Config.prototype.getResultsDir = function () {
	return path.join(this.getGuerillaDir(), 'Results');
}

Config.prototype.getTempDir = function () {
	return path.join(this.getGuerillaDir(), 'Temp');
}

Config.prototype.validate = function () {
	if (!this.host) throw new Error('Config is missing host.');
	if (!this.port) throw new Error('Config is missing port.');
	if (!this.db) throw new Error('Config is missing db.');
	var urlObj = getUrlObj(this.host, this.port);
	if (!(urlObj.protocol && urlObj.port && urlObj.host && urlObj.hostname)) 
		throw new Error('Hostname in config is invalid.');

	var mode = this.getMode();
	if (mode === 'worker'){
		if (!fs.lstatSync(this.output_root_dir).isDirectory()){
			throw new Error('Config error. The supplied output_root_dir is not a directory:' + this.output_root_dir );
		}
	}
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
