/*
 * Guerilla
 * Copyright 2016, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Installs an APK and runs a monkey test on an Android device. Outputs networks usage, memory usage and logcat.
 *
 * { "type": "javascript",
 *   "task": "android-instrumentation-test",
 *   "apk_name": "server-debug.apk",
 *   "test_apk_name": "app-debug-androidTest-unaligned.apk",
 *   "artifact_path": "<path_to_collect_data_after_test>",
 *   "permissions": ["android.permission.WRITE_EXTERNAL_STORAGE"] }
 */

module.exports.validate = function validate() {
    return {
        params: {
            apk_name: 'required',
            test_apk_name: 'required',
            artifact_path: 'optional',
            permissions: 'optional'
        },
        context: {
            apk_dir: 'required',
            device: 'required'
        }
    };
};

module.exports.execute = function execute(params, context, exec, callback) {

    // imports
    var async = context.require('async');
    var path = context.require('path');
    var _ = context.require('underscore');

    // services
    var logcatService = new context.services.LogcatService(context, exec);
    var androidMemoryService = new context.services.AndroidMemoryService(context, exec);
    var androidNetworkService = new context.services.AndroidNetworkService(context, exec);

    // data holders
    var packageName;
    var errorFound;
    var errorMessage = '';

    // execute
    async.series([
        function (cb) {
            context.runTask({
                type: 'javascript',
                task: 'android-install',
                apk_name: params.apk_name
            }, cb);
        },
        function (cb) {
            context.runTask({
                type: 'javascript',
                task: 'android-install',
                apk_name: params.test_apk_name
            }, cb);
        },
        function (cb) {
            var service = new context.services.APKToPackageNameService(context, exec);
            service.convert(context.apk_dir, params.apk_name, function (error, result) {
                packageName = result;
                cb(error);
            });
        },
        function (cb) {
            if (params.permissions) {
                context.runTask({
                    type: 'javascript',
                    task: 'android-permission',
                    package_name: packageName,
                    permissions: params.permissions
                }, cb);
            } else {
                cb();
            }
        },
        function (cb) {
            logcatService.start(cb);
        },
        function (cb) {
            androidMemoryService.start(packageName, cb);
        },
        function (cb) {
            androidNetworkService.start(packageName, cb);
        },
        function (cb) {
            context.addPostJobTask({
                type: 'javascript',
                task: 'android-force-stop',
                package_name: packageName
            });
            cb();
        },
        function (cb) {
            if (params.artifact_path) {
                context.addPostJobTask({
                    type: "javascript",
                    task: "android-pull",
                    path: params.artifact_path
                });
            }
            cb();
        },
        function (cb) {
            var cmd = 'adb';
            var args = [
                '-s',
                context.device.identifier,
                'shell',
                'am',
                'instrument',
                '-w',
                '-r',
                '-e',
                'debug',
                'false',
                packageName + '.test/android.support.test.runner.AndroidJUnitRunner'];
            var options = {
                log: [true, false, false, true],
                file: path.join(context.output_dir, 'instrumentation-log.txt'),
                stdout: function (data) {
                    var error = data.match(/There [were|was]* \d+ failures?/);
                    if (error) errorFound = true;
                    if (errorFound) errorMessage += data;
                }
            };
            exec(cmd, args, options, cb, function (error) {
                if (error) return callback(error);
            });
        }
    ], function (error) {
        androidNetworkService.stop();
        androidMemoryService.stop();
        logcatService.stop();
        var output = _.extend(androidMemoryService.stats, androidNetworkService.stats);
        if (errorFound) return callback(new Error(errorMessage));
        callback(error, output, true);
    });
};

module.exports.verify = function verify(params, output, context, exec, callback) {
    callback(null, true);
};