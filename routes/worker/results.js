/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all result endpoints.
 */

var router = require('express').Router();
var fs = require('fs-extra');
var async = require('async');
var path = require('path');
var models = require(path.join(__rootdir, 'lib', 'db')).models();
var Result = models.Result;

router.get('/jobs/:job_id/results/:result_number/badge', function (req, res, next) {
    Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, function (error, result) {
        if (error || !result) return next(new Error(error));
        var label = 'guerilla';
        var color = 'yellow';
        if (result.status === 'failure') {
            color = 'red';
        } else if (result.status === 'success') {
            color = 'green';
        }
        if (req.query.label) {
            label = req.query.label;
        }
        res.redirect('https://img.shields.io/badge/' + label + '-' + result.status + '-' + color + '.svg');
    });
});

router.get('/jobs/:job_id/results/:result_number/files', function (req, res, next) {
	Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, function (error, result) {
		if (error || !result) return next(new Error(error));
		if (!result.output_dir) return next();

		fs.readdir(result.output_dir, function (error, allFiles) {
			if (error) 
				return next(error)

			var files = [];
			async.each(allFiles, function (file, cb) {
				if (file == '.DS_Store') return cb();
				fs.stat(path.join(result.output_dir, file), function (error, stat) {
					if (error) return cb();
					if (!stat.isDirectory()) files.push(file);
					cb();
				});
			}, function (error) {
				if (error) return next(error);
				res.send({ files: files });
			});
		});

	});
});

router.get('/jobs/:job_id/results/:result_number/:filename', function (req, res, next) {
	Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, function (error, result) {
		if (error || !result) return next(new Error(error));
		res.sendFile(path.join(result.output_dir, req.params.filename));
	});
});

module.exports = router;