/*
 * Guerilla
 * Copyright 2016, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Pull data from an android device.
 *
 * { "type": "javascript",
 *   "task": "android-pull",
 *   "path": "<path_to_collect_data>" }
 */

module.exports.validate = function validate() {
    return {
        params: {
            path: 'required'
        },
        context: {
            device: 'required'
        }
    };
};

module.exports.execute = function execute(params, context, exec, callback) {
    var cmd = 'adb';
    var args = [
        '-s',
        context.device.identifier,
        'pull',
        params.path
    ];
    var options = {cwd: context.output_dir};
    exec(cmd, args, options, function (error) {
        callback(error, null, true);
    });
};