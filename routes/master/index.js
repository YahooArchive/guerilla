/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Main router for the express application.
 */

var router = require('express').Router();

router.get('/', function (req, res, next) {
	res.redirect('/projects');
});

module.exports = router;