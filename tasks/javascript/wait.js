/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Pauses the execution of tasks.
 */

module.exports.validate = function validate () {
	return {
		params: {
			seconds: 'optional',
			message: 'optional'
		}
	};
};

module.exports.execute = function execute (params, context, exec, callback) {
	var seconds = params.seconds || 30;
	if (params.message) context.log(params.message);
	context.log('Waiting for ' + seconds + ' seconds.');
	setTimeout(callback, seconds * 1000);
};