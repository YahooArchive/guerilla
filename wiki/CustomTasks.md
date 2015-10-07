## Custom Tasks

Custom tasks give you the ability to automate things that are specific to your project. If you believe a custom task is generic enough to be used across projects, submit a pull request to have it added to the growing list of core Guerilla tasks.

### Bash Tasks

Bash scripts should be used for very small tasks. The current working directory of the task is the project root. The following parameter can be used to pass values to the script from the task definition in the job configuration file.

- `args` **Array** *Optional* - Command line arguments that are passed to the script.

### JavaScript Tasks

Custom tasks written in JavaScript must be written a certain way for Guerilla to be able to run them. You can use the core Guerilla tasks as examples.

#### Anatomy of a Task

A task is made up of the three functions described below, all of which are optional. They are called in the order listed below. The task must set `module.exports.validate`, `module.exports.execute`, and `module.exports.verify` to the implemented functions.

##### function validate()

This function is used to validate the parameters passed into the task. This function should return an object with two keys, "params" and "context". An example is shown here:

```javascript
return {
    params: {
        param_1: 'required',
        param_2: 'optional',
        param_3: function (params, context) {
            if (params.param_2) return true; // param_3 is required if param_2 is provided.
            return false;
        }
    },
    context: {
        device_identifier: 'required'
    }
};
```

##### function execute(params, context, exec, callback)

This function is responsible of executing the task.

- `params` **Object** - Parameters of the task.
- `context` **Object** - The context object explained below.
- `exec(cmd, args, options, cb)` **Function** - A wrapper around Node.js's child_process.spawn.
    + `cmd` **String** - The command to run.
    + `args` **Array(String)** - List of arguments.
    + `options` **Object** - [Reference Node.js's docs](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Additional options are also provided.
    + `cb(error)` **Function** - Called when finished executing.
- `callback(error, output)` **Function** - The callback needs to be called once execution is complete.
    + `error` **Error** *Optional* - If not null, the job will fail and will not continue to the `verify` function. Otherwise, the `verify` function will be triggered. 
    + `output` **Object** *Optional* - These values will appear on results page, and reports can be generated based on these.

##### function verify(params, output, context, exec, callback)

This function is used to verify the result of execution.

- `params` **Object** - Parameters of the task.
- `output` **Object** - The output from the execute task. 
- `context` **Object** - The context object explained below.
- `exec(cmd, args, options, cb)` **Function** - A wrapper around Node.js's child_process.spawn.
    + `cmd` **String** - The command to run.
    + `args` **Array(String)** - List of arguments.
    + `options` **Object** - [Reference Node.js's docs](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Additional options are also provided.
    + `cb(error)` **Function** - Called when finished executing.
- `callback(error, output)` **Function** - The callback needs to be called once verification is complete. 
    + `error` **Error** *Optional* - If not null, the job will fail and will not continue to execute further tasks. Otherwise, the next task will be triggered. 
    + `output` **Object** *Optional* - These values will appear on results page, and reports can be generated based on these.

#### The Context Object

The context object is initiated with certain properties and helper functions at the start of a job run. Each task can add on to this object for later tasks to use.

- `bin_dir` **String** - Path to the directory containing utilities scripts and libraries that aren't available through NPM.
- `output_dir` **String** - Path to the directory where the task should write all files to. Any files in this directory will be available for the user to download from the results page. 
- `working_dir` **String** - This directory is where the project is checked out from GitHub and compiled.
- `device_identifier` **String** - The UDID or serial number of the device. This will be undefined if no device was specified.
- `log(string, callback)` **Function** - Logs to the console.txt file.
    + `string` **String** - The string to log.
    + `callback(error)` **Function** *Optional* - Called when finished writing to the log file.
- `output()` **Function** - Returns output data for the job.
- `createReport(config)` **Function** - Creates a report. This report is shown on the results page.
    + `config` **Object** - The report configuration. Can have a file key that points to a .csv file.
- `require(module)` **Function** - A wrapper around Node.js's require function. This should be used in custom tasks for proper lookups.
    + `module` **String** - Module to require.
- `exists(v)` **Function** - Utility function to determine if parameter is undefined or null.
- `runTask(config, callback)` **Function** - Run another task.
    + `config` **Object** - The task definition.
    + `callback(error)` **Function** - Called when task is finished executing.
- `addPostJobTask(config)` **Function** - Add a task to the end of the job. A use case for this would be that every install task should have a uninstall task at the end of the run.
    + `config` **Object** - The task definition.
- `previous(callback)` **Function** - Retrieves the context object of the previous run for that job.
    + `callback(error, previousContext)` **Function** - Provides the previous context or an error.

#### Services

Services are utilities that tasks can use.

- `android-memory` - Polls memory usage of an Android device.
- `android-network` - Polls network usage of an Android device.
- `android-screenshot` - Takes a screenshot of an Android device.
- `apk-to-package-name` - Finds the package name from a .apk file.
- `app-to-bundle-identifier` - Finds the bundle identifier from a .app/.ipa file.
- `finder` - Utility to find files.
- `ios-system-log` - Retrieves the system log from an iOS device.
- `logcat` - Retrieves the Logcat from an Android device.