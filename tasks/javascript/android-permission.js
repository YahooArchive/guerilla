/*
 * Guerilla
 * Copyright 2016, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Grant permissions for an app.
 *
 * { "type": "javascript",
 *   "task": "android-permission",
 *   "package_name": "<app_package_name>",
 *   "permissions": ["android.permission.WRITE_EXTERNAL_STORAGE"] }
 */

module.exports.validate = function validate() {
    return {
        params: {
            package_name: 'required',
            permissions: 'required'
        },
        context: {
            device: 'required'
        }
    };
};

module.exports.execute = function execute(params, context, exec, callback) {

    // imports
    var async = context.require('async');
    var _ = context.require('underscore');

    // run adb shell pm grant <package_name> <permission>
    var tasks = [];
    _.each(params.permissions, function (permission) {
        tasks.push(function (cb) {
            var cmd = 'adb';
            var args = [
                '-s',
                context.device.identifier,
                'shell',
                'pm',
                'grant',
                params.package_name,
                permission
            ];
            var options = {cwd: context.output_dir};
            exec(cmd, args, options, cb);
        });
    });

    // execute all
    async.series(tasks, function (error) {
        callback(error, null, true);
    });
};