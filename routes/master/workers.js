/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all worker endpoints.
 */

var router = require('express').Router();
var path = require('path');
var request = require('request');
var config = require(path.join(__rootdir, 'lib', 'config'));

var workers = [];
config.workers.forEach(function (worker, index) {
	worker.id = index;
	if (worker.host.slice(-1) === '/') {
		worker.host = worker.host.slice(0, -1);
	}
	if (!worker.host.includes('://')) {
		worker.host = 'http://' + worker.host;
	}
	worker.url = worker.host + ':' + worker.port + '/';
	workers.push(worker);
});

router.get('/workers', function (req, res, next) {
	res.render('master/workers', { workers: workers });
});

router.get('/workers/:worker_id', function (req, res, next) {
	var worker_id = req.params.worker_id;
	if (!workers[worker_id])
		return next();

	res.redirect(workers[worker_id].url);
});

router.get('/workers/:worker_id/health', function (req, res, next) {
	var worker_id = req.params.worker_id;
	if (!workers[worker_id])
		return next();

	request(workers[worker_id].url + 'health', function (error, response, body) {
		if (error)
			return next(error);
		
		res.send(body);
	});
});


module.exports = router;