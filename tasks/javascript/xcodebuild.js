/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Builds an iOS project.
 */

var path = require('path');
var async = require('async');

module.exports.execute = function execute (params, context, exec, callback) {
	var p = {}
	for (var key in params) {
		p[key] = params[key];
	}

	p.task = 'xcrun';
	p.build_actions = ['clean', 'build'];
	
	context.runTask(p, callback);
};