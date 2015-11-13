'use strict';
/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Keeps track of registered devices.
 */

var async = require('async');
var exec = require('child_process').exec;
var path = require('path');
var config = require('./config');
var Device = require('./device');

/**
 *
 * @param oslevel String of the form '9.1'
 * @param line String of the form 'iPhone 4s (05686243-BA24-44CE-94D9-D6823BF96E46) (Shutdown) {(unavailable, ...)}'
 * @returns {{tag: string}}
 */

/**
 *
 * @param oslevel String
 * @param line String to parse
 * @returns Device-like JSON object
 */
function createDevice(oslevel, line) {
	if (line.indexOf('unavailable') !== -1) throw new Error('createDevice-fed an unavailable device:' + oslevel + ':' +  line);
	var openparenIndex = line.indexOf('(');
	var closeParenIndex = line.indexOf(')');
	if (openparenIndex === -1) throw new Error("createDevice: could not find open paren in: " + oslevel + ':' + line);
	if (closeParenIndex === -1) throw new Error("createDevice: could not find close paren in: " + oslevel + ':' + line);
	var identifier = line.slice(openparenIndex + 1, closeParenIndex);
	if (identifier.length < 10) throw new Error('createDevice: could not find valid identifier in:' + oslevel + ':' + line);
	var name = line.slice(0, openparenIndex).trim();
	return {
		tag: 'ios-simulator,OS=' + oslevel + ',name=' + name,
		platform: 'ios',
        identifier: identifier,
		name: 'ios-simulator ' + name + ' (' + oslevel + ')',
		OS: oslevel,
		simulator: true,
		destination: 'OS=' + oslevel + ',name=' + name
	};
}

function isHeader(line) {
	var snippet =  line.slice(0,2);
	return (snippet === '--' || snippet === '==');
}

/**
 * A line oriented Stream over Simctl output from running $xcrun simctl list
 * @param array
 * @returns {{next: Function, advanceTillMatch: Function, hasMore: Function, nextValue: Function, nextValueAsOSLevel: Function, peekHasNextLineEntry: Function, peekIsHeader: Function, peekIsDoubleEquals: Function, peek: Function}}
 */
function makeSimctlStream(array){
	var nextIndex = 0;

	return {
		next: function () {
			return this.hasMore() ?
			{value: array[nextIndex++], done: false} :
			{done: true};
		},

		advanceTillMatch: function(line) {
			var result;
			do {
				result = this.next();

			} while (!result.done && (result.value.slice(0,line.length) !== line));
			if (result.done) throw new Error('unexpected end while advancingTillMatch:' + line);
		},

		hasMore: function() {
			return nextIndex < array.length;
		},

		nextValue: function() {
			var result = this.next();
			if (result.done) throw new Error("unexpected end during nextValue()");
			return result.value;
		},

		nextValueAsOSLevel: function() {
			var value  = this.nextValue();
			if (value.indexOf('--') !== 0) {
				throw new Error('expected oslevel prefix of "--" in:' + value);
			}
			var sliceStart = 2;
			var sliceEnd = value.indexOf('--', 2);
			return value.slice(sliceStart, sliceEnd).trim();
		},

		peekHasNextLineEntry: function() {
			return (this.hasMore() && !this.peekIsHeader());
		},

		peekIsHeader: function() {
			return this.hasMore() && isHeader(this.peek());
		},

		peekIsDoubleEquals: function() {
			return this.peek().indexOf("==") === 0;
		},

		peek: function() {
			return array[nextIndex];
		}

	};
}

/**
 *
 * @param stream
 * @returns {Array.<Device>}
 */
function getOSLevelEntries(stream) {
	var results = [];
	while (stream.hasMore() && !stream.peekIsDoubleEquals()) {
		var oslevel = stream.nextValueAsOSLevel();
		while (stream.peekHasNextLineEntry()) {
			var line = stream.nextValue();
			if (line.indexOf('unavailable') === -1) {
				results.push(createDevice(oslevel, line));
			}
		}
	}
	return results;
}


function getSimulatedDevicesFromLines(lines) {
	var stream = makeSimctlStream(lines);
	stream.advanceTillMatch('== Device Types ==');
	stream.advanceTillMatch('== Devices ==');
	//we're now just at the first os level entry.
	return getOSLevelEntries(stream);
}

function getSimulatedDevices(simctlString) {
	return getSimulatedDevicesFromLines(simctlString.split('\n'));
}

function getSimctlData(cb) {
	exec('xcrun simctl list', function(error, stdout, stderr) {
		if (error !== null) {
			return cb(error);
		}
		cb(null, stdout);
	});
}

function DeviceManager() {

	var self = this;
	self.devicesByTag = new Map();
	self.devices = [];
	var configDevices = Array.isArray(config.devices) ? config.devices : [];

	async.waterfall([
		function(cb){
			getSimctlData(cb);
		},
		function(simctlData, cb){
			try {
				var allDevices = configDevices.concat(getSimulatedDevices(simctlData));
				allDevices.forEach(function (json) {
					var device = new Device(json);
					self.devicesByTag.set(device.tag, device);
					self.devices.push(device);
				});
			}
			catch (err) {
				return cb(err);
			}

		}
	], function(err) {
		if (err) {
			throw err;
		}
	});



}



DeviceManager.prototype.findByTag = function (tag) {
	var result = this.devicesByTag.get(tag);
	return result ? result : null; //our api requires that we return null, not undefined if not found.
};

module.exports = new DeviceManager();