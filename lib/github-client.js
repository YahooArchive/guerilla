/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Retrieves job configuration files from GitHub using GitHub's API.
 */

var config = require('./config');
var GitHubAPI = require('github');

function GitHubClient () {
	this.github = new GitHubAPI({
	    version: '3.0.0',
	    debug: (logger.level <= logger.levels.d) ? true : false,
	    protocol: 'https',
	    host: config.github.host,
	    pathPrefix: '/api/v3',
	    timeout: 5000,
	    headers: {
	        'user-agent': 'Guerilla'
	    }
	});

	this.github.authenticate({
		type: 'oauth',
		token: config.github.token
	});
}

GitHubClient.prototype.getFile = function (user, repo, path, ref, callback) {
	var options = {
		user: user,
		repo: repo,
		path: path
	};

	if (ref) options.ref = ref;

	this.github.repos.getContent(options, function (error, data) {
		if (error) return callback(error);
		if (data.type !== 'file') return callback(new Error('Path is not a file.'));

		var encodedContent = data.content;
		var encoding = data.encoding;
		var buf = new Buffer(encodedContent, encoding);
		var content = buf.toString();

		callback(null, content);
	});
};

module.exports = new GitHubClient();