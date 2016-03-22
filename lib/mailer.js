/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Sends emails for job result status changes.
 */

import * as utilities from './utilities';

var nodemailer = require('nodemailer');
var fs = require('fs-extra');
var path = require('path');
var ejs = require('ejs');
var config = require('./config');

function Mailer () {
	this.transporter = nodemailer.createTransport({
		service: config.mailer.service,
		auth: {
			user: config.mailer.username,
			pass: config.mailer.password
		}
	});
}

function sendMail (self, to, subject, template, content, callback) {
	fs.readFile(template, 'utf8', function (error, file) {
		if (error) 
			return callback(error);

		var html = ejs.render(file, content);

		var mailOptions = {
		    from: 'Guerilla <' + config.mailer.username + '>',
		    to: to,
		    subject: subject,
		    html: html
		};

		self.transporter.sendMail(mailOptions, function (error, info) {
			callback(error, info);
		});
	});
}

function shouldMail (job, result, callback) {
	if (!(result.status === 'success' || result.status === 'failure')) return callback(null, false);

	job.getResults(['success', 'failure'], function (error, results) {
		if (error || !results) return callback(error);
		
		var last = results.pop();
		if (last && last.id !== result.id) return callback(null, false);
		if (results.length < 1) return callback(null, false);

		var prev = results.pop();
		var status;

		if (result.status === 'success' && prev.status === 'failure') status = 'SUCCESS (Changed from FAILURE)';
		else if (result.status === 'failure' && prev.status === 'success') status = 'FAILURE (Changed from SUCCESS)';
		else if (result.status === 'failure' && prev.status === 'failure') status = 'STILL FAILURE';
		else status = false;

		callback(null, status);
	});
}

Mailer.prototype.sendJobResultMail = function (url, job, result, callback) {
	var self = this;

	shouldMail(job, result, function (error, status) {
		if (error || !status) return callback(error);

		var to = job.notify;
		var subject = status + ' - ' + job.name + ' - #' + result.number;
		var template = path.join(__rootdir, 'views', 'mailer', 'job-result-mail.ejs');
		
		var link = url + 'jobs/' + job.id + '/results/' + result.number;
		var content = {
			status: status,
			result: result,
			link: link,
			moment: require('moment'),
			formatMilliseconds: utilities.formatMilliseconds
		};

		sendMail(self, to, subject, template, content, callback);
	});
}

module.exports = new Mailer();