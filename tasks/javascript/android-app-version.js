/*
 * Guerilla
 * Copyright 2016, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Fetch app version for the app defined.
 *
 * { "type": "javascript",
 *   "task": "android-app-version",
 *   "apps": [{
 *     "name": "netflix",
 *     "package_name": "com.netflix.ninja"}] }
 */

module.exports.validate = function validate() {
    return {
        params: {
            apps: 'required'
        }
    };
};

module.exports.execute = function execute(params, context, exec, callback) {

    // imports
    var async = context.require('async');
    var _ = context.require('underscore');

    // run adb
    var tasks = [];
    var report = {};
    _.each(params.apps, function (app) {
        tasks.push(function (cb) {
            var version;
            var cmd = 'sh';
            var args = [
                '-c',
                'adb -s ' + context.device.identifier + ' shell dumpsys package ' + app.package_name +
                ' | grep versionCode' +
                ' | sed "s/.*versionCode=\\([0-9]*\\).*/\\1/g"'];
            var options = {
                stdout: function (output) {
                    version = parseInt(output);
                }
            };
            exec(cmd, args, options, function (error) {
                if (error) return cb(error);
                if (!version) return cb(new Error('Failed to get version of ' + app.package_name));
                report[app.name] = version;
                cb();
            });
        });
    });

    // execute all
    async.series(tasks, function (error) {
        callback(error, report);
    });
};