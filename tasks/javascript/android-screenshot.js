/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Outputs a screenshot of an Android device.
 */

var path = require('path');

module.exports.execute = function execute (params, context, exec, callback) {
	var service = new context.services.AndroidScreenshotService(context, exec);
	service.snap(callback);
};