## Setting up Jobs

### Creating a Job

Jobs are defined by a JSON configuration file.

- `name` **String** - The name of the job.
- `platform` **String** - "ios" or "android".
- `enabled` **Boolean** *Optional* - This determines if the job should run on the provided cron_time. True by default.
- `cron_time` **String** *Optional* - A cron time to define a schedule for a recurring job. If not provided, the job will not automatically be triggered.
- `device_tag` **String** *Optional* - The tag of the desired device. Required if the job needs a device to run on. If not provided, the job will not have access to a device.
- `notify` **Array(String)/String** *Optional* - An email or emails to be notified when the job changes from passing to failing, failing to passing, or consecutive failures. Notifications will not be sent for consecutive passing runs.
- `timeout` **String** *Optional* - Timeout in seconds. Default is 3600 seconds (60 minutes).
- `checkout` **Object** - A single task definition used to checkout the project. If more than one task is required to checkout the project, set checkout.type and compile.type to "none" and add checkout and compile task definitions to the tests array.
- `compile` **Object** - A single task definition used to compile the project. If more than one task is required to compile the project, set compile.type to "none" and add compile task definitions to the tests array.
- `tests` **Array(Object)** - An array of task definitions that are in addition to checkout and compile.
- `reports` **Array(Object)** *Optional* - An array of configurations defining reports to generate. These reports will show trends across runs.

### Defining Tasks

Each task is defined by a JSON object.

- `type` **String** - The type of task. "javascript", "bash", or "none".
- `task` **String** *Required if type is not none and custom_task is not provided* - The name of the core Guerilla task.
- `custom_task` **String** *Required if type is not none and task is not provided* - The file path of the custom task file relative to the project root.

Additional parameters are specific to the task.

### Generating Reports

- `title` **String** - The title of the report.
- `type` **String** - The type of report. "table", "line", or "bar".
- `y_axis_label` **String** *Optional* - The label of the Y axis.
- `series` **Array(String)** - An array of keys to be used as the series data of the report. These keys are the keys of the data ouputted by each job result.
- `thresholds` **Object** *Optional* - An object of threshold lines where the key is the label and the value is the value of the threshold.

### Adding a Job on Guerilla

First create a project. A project is a collection of jobs. Then click the add icon to create a job for that project. The following fields point to the location of the configuration file for the job you wish to add to Guerilla.

- `User/Org` - The user or organization under which the project containing the configuration file resides.
- `Repo` - The repository that contains the configuration file.
- `Path` - The path from the root of the repository to the configuration file, including the file name.
- `Commit/Branch/Tag` *Optional* - The commit, branch, or tag of the repository. Defaults to the default branch of the repository.

### Example

```json
{
    "name": "Example Job",
    "platform": "android",
    "cron_time": "0 0 * * *",
    "device_tag": "device_type_1",
    "notify": "example@yahoo.com",
    "checkout": {
        "type": "javascript",
        "task": "git-checkout",
        "checkout_url": "git@github.com:yahoo/SomeAndroidProject.git",
        "branch": "master"
    },
    "compile": {
        "type": "javascript",
        "task": "gradle",
        "gradle_tasks": ["clean", "assembleDebug"]
    },
    "tests": [
        {
            "type": "javascript",
            "task": "apk-size",
            "apk_name": "app-debug.apk"
        }
    ],
    "reports": [
        {
            "title": "APK Size",
            "type": "line",
            "y_axis_label": "Size (MB)",
            "series": [
                "apk_size"
            ],
            "thresholds": {
                "max": 10
            }
        }
    ]
}
```

### Example with pull request in checkout.

Note: the checkout Will fail if there are merge conflicts. For success the output will show the specific sha for the
pulled branch.

```json
{
    "name": "Example Job",
    "platform": "android",
    "cron_time": "0 0 * * *",
    "device_tag": "device_type_1",
    "notify": "example@yahoo.com",
    "checkout": {
        "type": "javascript",
        "task": "git-checkout",
        "checkout_url": "git@github.com:yahoo/SomeAndroidProject.git",
        "branch": "master",
        "pull": ["origin", "branch-to-pull"]
    },
    "compile": {
        "type": "javascript",
        "task": "gradle",
        "gradle_tasks": ["clean", "assembleDebug"]
    },
    "tests": [
        {
            "type": "javascript",
            "task": "apk-size",
            "apk_name": "app-debug.apk"
        }
    ],
    "reports": [
        {
            "title": "APK Size",
            "type": "line",
            "y_axis_label": "Size (MB)",
            "series": [
                "apk_size"
            ],
            "thresholds": {
                "max": 10
            }
        }
    ]
}
```
