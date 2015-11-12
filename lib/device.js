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
	this.simulator = false;
	//following could be in a subtype
	if (typeof json.simulator !== 'undefined') {
		this.simulator = json.simulator;
		this.destination = json.destination;
	}
}

module.exports = Device;