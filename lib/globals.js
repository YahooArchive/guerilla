/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Sets global variables for the application.
 */

var path = require('path');
global.__rootdir = path.join(__dirname, '..');
global.logger = require('./logger');
global.git_sha = require('git-rev-sync').long();
require('browserify-middleware');