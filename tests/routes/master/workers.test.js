'use strict';

var mockery = require('mockery');
var rewire = require('rewire');
var path = require('path');
var assert = require('chai').assert;
var _ = require('lodash');

var __ROOTDIR = path.join(__dirname, '..', '..', '..');

describe('routes', function () {
	describe('master', function () {
		describe('workers', function () {
			var workers, _workers, configMock;

			before(function () {
				mockery.enable({
					warnOnUnregistered: false,
					warnOnReplace: false
				});
				require(path.join(__ROOTDIR, 'lib', 'globals'));
			});
			beforeEach(function () {
				configMock = {
					workers: [
						// default
						{
							name: "Guerilla Worker",
							host: "localhost",
							port: 8888
						},
						// with http protocol
						{
							name: "Guerilla Worker",
							host: "http://localhost",
							port: 8118
						},
						// with non http protocol
						{
							name: 'Secure Guerilla Worker?',
							host: 'https://worker.example.com/',
							port: 443
						}
					]
				};
				mockery.registerMock(path.join(__ROOTDIR, 'lib', 'config'),
					configMock);

				workers = rewire(
					path.join(__ROOTDIR, 'routes', 'master', 'workers'));
				_workers = workers.__get__('workers');
			});
			after(function () {
				mockery.disable();
			});
			it('should use http:// as a default protocol', function () {
				assert.equal(_workers[0].host, 'http://localhost',
					'should start with http://');
			});
			it('should use http:// as a default protocol', function () {
				assert.equal(_workers[1].host, 'http://localhost',
					'should start with http://');
			});
			it('shouldnt modify existing protocols', function () {
				assert.equal(_workers[2].host, 'https://worker.example.com',
					'should start with https://');
			});
		});
	});
});
