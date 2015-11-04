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
var url = require('url');
var argv = require('yargs')
    .usage('Usage: $0 {--master | --worker} [--config ConfigFile]')
    .boolean('master')
    .boolean('worker')
    .default('config', false, 'Optional config file location. Defaults to {data_dir}/config')
    .argv;

if (argv.config && argv.config === true) {
    throw new Error('--config defined without any following configFile')
}

function expandTilde(apath) {
    var homedir = process.env['HOME'];
    if (!apath) return apath;
    if (apath === '~') return homedir;
    if (apath.slice(0, 2) !== '~/') return apath;
    return path.join(homedir, apath.slice(2));
}

/**
 *
 * @param str a String with optional %% delimited env variables
 * @returns String a new string with env variables in str replaced by their values
 * @throws Error if a variable is not defined.
 */
function resolveEnvVars(str) {

    return str.replace(/%([^%]+)%/g, function (_, n) {
        var aLookup = process.env[n];
        if (typeof aLookup === 'undefined') {
            throw new Error('Failed to find env variable "' + n + '" in ' + str);
        }
        return aLookup;
    });
}

function getConfig(mode) {
    var pathArray = [];
    if (argv.config) {
        var altConfigPath = expandTilde(argv.config);
        altConfigPath = path.resolve(altConfigPath);
        altConfigPath = resolveEnvVars(altConfigPath);
        logger.i('--config command line flag detected. Config is from: ' + altConfigPath);
        pathArray.push(altConfigPath);
    }
    else {
        pathArray.push(__rootdir, 'config', mode, 'config.json');
    }
    return require(path.join.apply(null, pathArray))
}

function getUrlObj(host, port) {
    if (host.slice(-1) === '/') host = host.slice(0, -1);
    var urlObj = url.parse(host + ':' + port + '/');
    return urlObj;
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
    return path.join(this.getDataDir(), 'Temp');
}

Config.prototype.getUrl = function () {
    var urlObj = getUrlObj(this.host, this.port);
    return urlObj.href;
}

var config = new Config();
validate(config);
module.exports = config;
