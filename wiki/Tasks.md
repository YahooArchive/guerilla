## Tasks

### Bash Tasks

There are no core Guerilla tasks of type "bash". Users may write custom bash tasks.

### JavaScript Tasks

- [`android-force-stop`](#android-force-stop)
- [`android-install`](#android-install)
- [`android-kill-monkey`](#android-kill-monkey)
- [`android-launch`](#android-launch)
- [`android-monkey`](#android-monkey)
- [`android-screenshot`](#android-screenshot)
- [`android-uninstall`](#android-uninstall)
- [`ant`](#ant)
- [`apk-size`](#apk-size)
- [`clean`](#clean)
- [`dex-method-counts`](#dex-method-counts)
- [`espresso`](#espresso)
- [`git-checkout`](#git-checkout)
- [`gradle`](#gradle)
- [`ios-extract-device-logs`](#ios-extract-device-logs)
- [`ios-install`](#ios-install)
- [`ios-uninstall`](#ios-uninstall)
- [`repo-checkout`](#repo-checkout)
- [`uiautomation`](#uiautomation)
- [`wait`](#wait)
- [`xcodebuild`](#xcodebuild)
- [`xcrun`](#xcrun)
- [`xctest`](#xctest)
- [`zip-results`](##zip-results)

======
#### android-force-stop

Terminates an Android process.

- `apk_name` **String** *Required if package_name is not provided* - Name of the APK to terminate.
- `package_name` **String** *Required if apk_name is not provided* - Name of the package to terminate.

======
#### android-install

Installs an APK to an Android device.

- `apk_name` **String** - Name of the APK to install.

======
#### android-kill-monkey

Terminates any monkey processes running on an Android device.

======
#### android-launch

Launches an application on an Android device.

- `apk_name` **String** *Required if package_name is not provided* - Name of the APK to launch.
- `package_name` **String** *Required if apk_name is not provided* - Name of the package to launch.

======
#### android-monkey

Installs an APK and runs a monkey test on an Android device. Outputs networks usage, memory usage and logcat.

- `apk_name` **String** - Name of the APK to test.
- `event_count` **Integer** - Number of events the monkey will generate.
- `throttle` **Integer** *Optional* - Inserts a fixed delay between events. You can use this option to slow down the monkey. If not specified, there is no delay and the events are generated as rapidly as possible.
- `seed` **Integer** *Optional* - Seed value for pseudo-random number generator. If you re-run the monkey with the same seed value, it will generate the same sequence of events.

======
#### android-screenshot

Outputs a screenshot of an Android device.

======
#### android-uninstall

Uninstalls an application from an Android device.

- `apk_name` **String** *Required if package_name is not provided* - Name of the APK to uninstall.
- `package_name` **String** *Required if apk_name is not provided* - Name of the package to uninstall.

======
#### ant

Runs Ant.

- `ant_targets` **Array(String)** - Targets for Ant to run.
- `build_file` **String** *Optional* - Name of the build file relative to the project root. Defaults to build.xml.

======
#### apk-size

Calculates the size of an APK.

- `apk_name` **String** - Name of the APK to measure.
- `verify` **Object** *Optional*
    + `max_size` **Number** - Fails the task if the APK size exceeds this value.
    + `max_delta` **Number** - Fails the task if the APK size increased by this percentage value compared to the previous run.

======
#### clean

Cleans the working directory of the job.

======
#### dex-method-counts

Calculates the number of methods in an APK and outputs a breakdown report.

- `apk_name` **String** - Name of the APK to measure.
- `verify` **Object** *Optional*
    + `max_size` **Number** - Fails the task if the method count exceeds this value.
    + `max_delta` **Number** - Fails the task if the method count increased by this percentage value compared to the previous run.

======
#### espresso

Installs an APK and runs espresso tests on an Android device. Outputs network usage, memory usage and logcat.

- `apk_name` **String** - Name of APK to test.
- `test_apk_name` **String** - Name of test APK.
- `test_class` **String** *Optional* - Class of tests to run. Runs all tests if not provided.
- `test_name` **String** *Optional*  - Name of test to run. Only used if test_class is provided.

======
#### git-checkout

Checks out a project from GitHub.

- `checkout_url` **String** - URL of project to checkout from.
- `branch` **String** *Optional* - Branch of project to checkout. Defaults to the default branch.
- `project_root` **String** *Optional* - Path from the checkout root to the root of the project if they are different. Defaults to the checkout root.
- `pull` **Array** *Optional* - repo and branch arguments to a git pull command applied after the inital single branch clone. 

======
#### gradle

Runs Gradle.

- `gradle_tasks` **Array(String)** - Tasks for Gradle to run.
- `build_file` **String** *Optional* - Name of the build file relative to the project root. Defaults to build.gradle.

======
#### ios-extract-device-logs

Uses Applescript to extract device logs from an iOS device via Xcode.

- `start_date` **Date** *Optional* - All device logs after this date are extracted. Defaults to 30 minutes before execution.

======
#### ios-install

Installs an application on an iOS device.

======
#### ios-uninstall

Uninstalls an application from an iOS device.

======
#### repo-checkout

Checks out a project from GitHub using repo.

- `checkout_url` **String** - Checkout URL of project containing the repo manifest.
- `branch` **String** *Optional* - Branch of project containing the repo manifest.
- `project_root` **String** *Optional* - Root of project after checking out with repo if different from the checkout root. Defaults to the checkout root.
- `manifest_file` **String** *Optional* - Name of repo manifest file relative to the checkout root of the manifest project. Defaults to default.xml.

======
#### uiautomation

Installs an application and runs UIAutomation scripts on an iOS device. Outputs the Instruments trace, iOS system log and iOS device logs.

- `test_file` **String** - UIAutomation JavaScript file relative to the project root to execute.
- `trace_template` **String** *Optional* - Name of a trace template relative to the project root. Defaults to a trace template containing the Automation tool.

======
#### wait

Pauses the execution of tasks.

- `seconds` **String** *Optional* (Default: 30) - Seconds to wait.
- `message` **String** *Optional* - A message to be logged when waiting.

======
#### xcodebuild

Builds an iOS project.

- `workspace` **String** - Name of the workspace file relative to the project root. Do not include the .xcworkspace extension.
- `scheme` **String** - The scheme to use.
- `configuration` **String** *Optional* - The configuration to use. Defaults to the default configuration for command line build set in your project.

======
#### xcrun

Runs the xcrun command line tool.

- `workspace` **String** - Name of the workspace file relative to the project root. Do not include the .xcworkspace extension.
- `scheme` **String** - The scheme to use.
- `configuration` **String** *Optional* - The configuration to use. Defaults to the default configuration for command line build set in your project.
- `build_actions` **Array(String)** *Optional* - Build actions to perform on the target. Defaults to ["build"].

======
#### xctest

Runs XCTests on an iOS device.

- `workspace` **String** - Name of the workspace file relative to the project root. Do not include the .xcworkspace extension.
- `scheme` **String** - The scheme to use.
- `configuration` **String** *Optional* - The configuration to use. Defaults to the default configuration for command line build set in your project.

======
#### zip-results

Zips all output files.
