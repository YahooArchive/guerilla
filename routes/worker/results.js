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
    var callback = function (error, result) {
        if (error || !result) return next(new Error(error));
        var color = 'yellow';
        if (result.status === 'failure') {
            color = 'red';
        } else if (result.status === 'success') {
            color = 'green';
        }
        res.redirect('https://img.shields.io/badge/guerilla-' + result.status + '-' + color + '.svg');
    };
    if (number === 'last') {
        Result.statics.getLast(req.params.job_id, callback);
    } else if (number === 'current') {
        Result.statics.getCurrent(req.params.job_id, callback);
    } else {
        Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, callback);
    }
});

router.get('/jobs/:job_id/results/:result_number/files', function (req, res, next) {
	var callback = function (error, result) {
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
	};
    if (number === 'last') {
        Result.statics.getLast(req.params.job_id, callback);
    } else if (number === 'current') {
        Result.statics.getCurrent(req.params.job_id, callback);
    } else {
        Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, callback);
    }
});

router.get('/jobs/:job_id/results/:result_number/:filename', function (req, res, next) {
    var callback = function (error, result) {
		if (error || !result) return next(new Error(error));
		res.sendFile(path.join(result.output_dir, req.params.filename));
	};
    if (number === 'last') {
        Result.statics.getLast(req.params.job_id, callback);
    } else if (number === 'current') {
        Result.statics.getCurrent(req.params.job_id, callback);
    } else {
        Result.statics.findByJobIdAndNumber(req.params.job_id, req.params.result_number, callback);
    }
});

module.exports = router;