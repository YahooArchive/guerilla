/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Connects to the database and gives access to the database models.
 */

var path = require('path');
var Schema = require('caminte').Schema;

function DB () {
	this.db = null;
}

DB.prototype.connect = function (config, callback) {
    var self = this;
    if (self.db) {
        return callback(null, self.db);
    }
    if (!config.password && config.host === 'localhost') {
        config.password = '';
    }
    self.db = new Schema(config.driver, config);
	require(path.join(__rootdir, 'models', 'Project')).init(self.db);
	require(path.join(__rootdir, 'models', 'Result')).init(self.db);
	require(path.join(__rootdir, 'models', 'ConfigLocation')).init(self.db);
	require(path.join(__rootdir, 'models', 'Job')).init(self.db);

	self.db.client.on('connect', function (error) {
		callback(error, self.db);
	});
}

DB.prototype.models = function () {
	if (this.db)
		return this.db.models;
}

module.exports = new DB();