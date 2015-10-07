/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Keeps track of registered devices.
 */

var path = require('path');
var config = require('./config');
var Device = require('./device');

function DeviceManager () {
	var self = this;
	self.devices = [];

	if (Array.isArray(config.devices)) {
		config.devices.forEach(function (json) {
			var device = new Device(json); 
			self.devices.push(device);
		});
	}
}

DeviceManager.prototype.findByTag = function (tag) {
	for (var i = 0; i < this.devices.length; i++) {
		if (this.devices[i].tag == tag)
			return this.devices[i];
	}

	return null;
};

module.exports = new DeviceManager();