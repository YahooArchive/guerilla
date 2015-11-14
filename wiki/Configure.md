## Configuring Guerilla

A Guerilla instance has one master server and multiple worker servers. Each server is configured through a config.json file as described below.

### Master

Copy `config/master/config.json.sample` to `config/master/config.json`

- `host` **String** - Host name for the Guerilla server.
- `port` **Integer** - Port on which to run the Guerilla server.
- `db` **Object** - Database connection information.
    + `driver` **String** - Database driver. This should be "redis".
    + `host` **String** - Host of the Redis server that Guerilla should connect to. Master and all workers need to connect to the same Redis instance.
    + `port` **Integer** - Port of the Redis server that Guerilla should connect to. Master and all workers need to connect to the same Redis instance.
- `github` **Object** - GitHub authentication information.
    + `host` **String** - Should be "api.github.com" for GitHub. May differ for enterprise GitHub.
    + `token` **String** - [GitHub OAuth token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/).
- `mailer` **Object** *Optional* - Authentication informtion for email account to sending notifications. Email notifications will not work if not provided. It is recommended to create a headless account for this purpose through Yahoo or Gmail.
    + `service` **String** - Email host. Must be "Yahoo" or "Gmail".
    + `username` **String** - The username of the account.
    + `password` **String** - The password for the account.
- `workers` **Array(Object)** *Optional* - Information regarding workers. Used only to check health of workers.
    + `name` **String** - Name of the worker server.
    + `host` **String** - Host of worker server.
    + `port` **Integer** - Port of worker server.

### Worker

Copy `config/worker/config.json.sample` to `config/worker/config.json`

- `name` **String** - Name of the worker server.
- `host` **String** - Host name for the Guerilla server.
- `port` **Integer** - Port on which to run the Guerilla server.
- `data_dir` **String** *Optional*- Root for all output. Defaults to ~/Guerilla if absent.
- `db` **Object** - Database connection information.
    + `driver` **String** - Database driver. This should be "redis".
    + `host` **String** - Host of the Redis server that Guerilla should connect to. Master and all workers need to connect to the same Redis instance.
    + `port` **Integer** - Port of the Redis server that Guerilla should connect to. Master and all workers need to connect to the same Redis instance.
- `devices` **Array(Object)** *Optional* - Information regarding connected devices.
    + `tag` **String** - A tag to indentify a type of device. This tag is used when specifying what kind of device to run a job on. For simulated
    devices the string must be of the form ```ios-simulator,OS=x.y,name=a-device-name```. To get the specific device names and os versions available
    on your device run ```xcrun simctl -list```. For the OS value only use the numeric portion of the OS.
    + `platform` **String** - "ios" or "android".
    + `name` **String** - Name and description of the device. 
    + `identifier` **String** - UDID (iOS) or serial (Android) or the device.
    + `OS` **String** - OS version information of the device.