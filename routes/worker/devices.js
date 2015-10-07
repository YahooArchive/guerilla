/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Router for all device endpoints.
 */

var router = require('express').Router();
var path = require('path');
var deviceManager = require(path.join(__rootdir, 'lib', 'device-manager'));

router.get('/devices', function (req, res, next) {
	res.render('worker/devices', { devices: deviceManager.devices });
});

module.exports = router;