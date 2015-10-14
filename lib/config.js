/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Reads and validates the master and worker config.json files.
 */

'use strict';


var fs = require('fs-extra');
var logger = require('./logger')
var path = require('path');
var url = require('url');
var argv = require('yargs')
    .usage('Usage: $0 {--master | --worker} [--config ConfigFile]')
	.boolean('master')
	.boolean('worker')
	.default('config', false, 'Optional config file location. Defaults to {guerillaDir}/config')
	.argv;

if (argv.config && argv.config === true) {
	throw new Error("--config defined without any following configFile")
}

var mode = 'unknown'

var expandTilde = function(apath) {
	var homedir = process.env['HOME'];
	if (!apath) return apath;
	if (apath == '~') return homedir;
	if (apath.slice(0, 2) != '~/') return apath;
	return path.join(homedir, apath.slice(2));
}

var initMode = function () {
	if (argv.master && argv.worker) throw new Error("Cannot invoke with both --master and --worker");
	if (argv.master) {
		mode = 'master';
		return;
	}
	if (argv.worker) {
		mode = 'worker';
		return;
	}
	throw new Error('Invalid mode.');
}

var getConfig = function(mode) {
	var pathArray = [];
	if(argv.config ) {
		var altConfigPath = expandTilde(argv.config);
		altConfigPath = path.resolve(altConfigPath);
		logger.i('--config command line flag detected. Config is from: ' + altConfigPath);
		pathArray.push(altConfigPath);
	}
	else {
		pathArray.push(__rootdir, 'config', mode, 'config.json');
	}
	return require(path.join.apply(this, pathArray))
}

var getUrlObj =function(host, port) {
	if (host.slice(-1) === '/') host = host.slice(0, -1);
	var urlObj = url.parse(host + ':' + port + '/');
	return urlObj;
}

function Config () {
	initMode();
	var config = getConfig(mode);

	for (var key in config) {
		this[key] = config[key];
	}
	
	if (mode === 'worker') {
		if (!this.data_dir) {
			this.data_dir = '~/Guerilla';
		}
		this.data_dir = expandTilde(this.data_dir);
		fs.mkdirsSync(this.data_dir);
	}

}

Config.prototype.getMode = function() {
	return mode;
}

Config.prototype.getDataDir = function () {
	return this.data_dir;
}

Config.prototype.getResultsDir = function () {
	return path.join(this.getDataDir(), 'Results');
}

Config.prototype.getTempDir = function () {
	return path.join(this.getDataDir(), 'Temp');
}

Config.prototype.validate = function () {
	if (!this.host) throw new Error('Config is missing host.');
	if (!this.port) throw new Error('Config is missing port.');
	if (!this.db) throw new Error('Config is missing db.');
	var urlObj = getUrlObj(this.host, this.port);
	if (!(urlObj.protocol && urlObj.port && urlObj.host && urlObj.hostname)) 
		throw new Error('Hostname in config is invalid.');

	var mode = this.getMode();
	if (mode === 'worker') {
		if (!fs.lstatSync(this.data_dir).isDirectory()){
			throw new Error('Config error. The supplied data_dir is not a directory:' + this.data_dir );
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
