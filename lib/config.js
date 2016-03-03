/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Reads and validates the master and worker config.json files.
 */

// jshint node: true
'use strict';


var fs = require('fs-extra');
var path = require('path');
var temp = require('temp');
var url = require('url');
var argv = require('yargs')
    .usage('Usage: $0 {--master | --worker} [--config ConfigFile]')
    .boolean('master')
    .boolean('worker')
    .boolean('saveTempFiles')
    .default('config', false, 'Optional config file location. Defaults to {data_dir}/config')
    .argv;

if (argv.config && argv.config === true) {
    throw new Error('--config defined without any following configFile')
}

if (argv.saveTempFiles) {
    logger.i('--saveTempFiles option: Guerilla temp files in the OS temp directory will not be deleted at process exit.');
} else {
    temp = temp.track();
}

function expandTilde(apath) {
    var homedir = process.env['HOME'];
    if (!apath) return apath;
    if (apath === '~') return homedir;
    if (apath.slice(0, 2) !== '~/') return apath;
    return path.join(homedir, apath.slice(2));
}

function processPath(aPath, aMessage) {
    var newPath = expandTilde(aPath);
    newPath = path.resolve(newPath)
    logger.i(aMessage + newPath);
    newPath = newPath.trim();
    return newPath;
}

function getConfigPath(mode) {
    if (argv.config) {
        return processPath(argv.config, '--config command line flag detected. Config is from: ');
    }
    if (mode === 'master' && process.env.GuerillaConfigFileMaster) {
        return processPath(process.env.GuerillaConfigFileMaster, 'The config file is from the environment variable GuerillaConfigFileMaster:');
    }
    if (mode === 'worker' && process.env.GuerillaConfigFileWorker) {
        return processPath(process.env.GuerillaConfigFileWorker, 'The config file is from the environment variable GuerillaConfigFileWorker:');
    }
    var aPath = path.join(__rootdir, 'config', mode, 'config.json');
    logger.i('The config file is from the default location:' + aPath);
    return aPath;
}

function getConfig(mode) {
    return require(getConfigPath(mode));
}

function getUrlObj(host, port) {
    if (host.slice(-1) === '/') host = host.slice(0, -1);
    if (host.indexOf('://') === -1) host = 'http://' + host;
    return url.parse(host + ':' + port + '/');
}

function initMode() {
    if (argv.master && argv.worker) throw new Error('Cannot invoke with both --master and --worker');
    if (argv.master) {
        return 'master';
    }
    if (argv.worker) {
        return 'worker';
    }
    throw new Error('Invalid mode. Expected either --master or --worker');
}

/**
 *
 * @param {config} a Config object
 */
function validate(config) {
    if (!config.host) throw new Error('Config is missing host.');
    if (!config.port) throw new Error('Config is missing port.');
    if (!config.db) throw new Error('Config is missing db.');
    var urlObj = getUrlObj(config.host, config.port);
    if (!(urlObj.protocol && urlObj.port && urlObj.host && urlObj.hostname))
        throw new Error('Hostname in config is invalid.');

    var mode = config.getMode();
    switch (mode) {
        case 'worker':
            break;
        case 'master':
            if (!config.github) throw new Error('Config is missing github.');
            if (!config.github.host) throw new Error('Config is missing github host.');
            if (!config.github.token) throw new Error('Config is missing github token.');

            if (!config.mailer) logger.w('Config is missing mailer. Email notifications will not work.');
            else if (!config.mailer.service) logger.w('Config is missing mailer service. Email notifications will not work.');
            else if (!config.mailer.username) logger.w('Config is missing mailer username. Email notifications will not work.');
            else if (!config.mailer.password) logger.w('Config is missing mailer password. Email notifications will not work.');
            break;
        default:
            throw new Error('Config::validate() internal error. Unexpected mode:' + mode)
    }
}

function Config() {
    this.mode = initMode();
    var config = getConfig(this.mode);

    for (var key in config) {
        this[key] = config[key];
    }

    if (this.mode === 'worker') {
        if (!this.data_dir) {
            this.data_dir = '~/Guerilla';
        }
        this.data_dir = expandTilde(this.data_dir);
        this.temp_dir = temp.mkdirSync("guerillatemp");
        if (argv.saveTempFiles) {
            logger.i('The temporary directory is: ' + this.temp_dir);
        }
    }

}

Config.prototype.getMode = function () {
    return this.mode;
}

Config.prototype.getDataDir = function () {
    return this.data_dir;
}

Config.prototype.getResultsDir = function () {
    return path.join(this.getDataDir(), 'Results');
}

Config.prototype.getTempDir = function () {
    return this.temp_dir;
}

Config.prototype.getUrl = function () {
    var urlObj = getUrlObj(this.host, this.port);
    return urlObj.href;
}

var config = new Config();
validate(config);
module.exports = config;
