/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all project endpoints.
 */

var router = require('express').Router();
var path = require('path');
var models = require(path.join(__rootdir, 'lib', 'db')).models();
var Project = models.Project;

router.get('/projects', function (req, res, next) {
	Project.statics.populateAll(function (error, projects) {
		if (error)
			return next(error);
		
		res.render('master/projects', { projects: projects });
	});
});

router.get('/projects/create', function (req, res, next) {
	res.render('master/create-project');
});

router.post('/projects', function (req, res, next) {
	Project.statics.createWithJSON(req.body, function (error, project) {
		if (error)
			return next(error);
		
		res.send({ success: true, redirect: '/' });
	});
});

router.get('/projects/:project_id', function (req, res, next) {
	Project.statics.populateById(req.params.project_id, function (error, project) {
		if (error || !project)
			return next(error);

		res.render('master/projects', { projects: [ project ] });
	});
});

router.get('/projects/:project_id/edit', function (req, res, next) {
	Project.findById(req.params.project_id, function (error, project) {
		if (error || !project)
			return next(new Error(error));

		res.render('master/edit-project', { project: project });
	});
});

router.put('/projects/:project_id', function (req, res, next) {
	Project.findById(req.params.project_id, function (error, project) {
		if (error || !project)
			return res.send({ success: false });

		project.edit(req.body, function (error, project) {
			if (error) 
				return res.send({ success: false });

			res.send({ success: true, redirect: '/' });
		});
	});
});

router.delete('/projects/:project_id', function (req, res, next) {
	Project.destroyById(req.params.project_id, function (error) {
		if (error)
			return res.send({ success: false });

		res.send({ success: true, redirect: '/' });
	});
});

module.exports = router;