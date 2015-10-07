/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Models a registered device.
 */

function Device (json) {
	this.tag = json.tag;
	this.name = json.name;
	this.platform = json.platform;
	this.identifier = json.identifier;
	this.OS = json.OS;
}

module.exports = Device;