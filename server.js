/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Entry point for the Guerilla server.
 */


require('./lib/globals');

git_sha = str;

logger.i("Guerilla git sha = " + git_sha);

var argv = require('yargs').argv;

if (argv.master) {
	require('./master.js');
}
else if (argv.worker) {
	require('./worker.js');
}
else {
	throw new Error('Must run with --master or --worker.');
}



function shutdown (callback) {
	var queue = require('./lib/queue');
	queue.shutdown(callback);
}
process.on('exit', function(code){
	logger.d('process.on("exit") event handled in server.js. Exiting process pid=' + process.pid);
});

process.on('SIGINT', function () {
	logger.w('\nSIGINT --- EXITING');
	shutdown(process.exit);
});

process.on('SIGTERM', function () {
	logger.w('\nSIGTERM --- EXITING');
	shutdown(process.exit);
});

process.on('uncaughtException', function (ex) {
	logger.e('EXITING: Uncaught Exception');
	logger.e(ex.stack);
	shutdown(process.exit);
});
