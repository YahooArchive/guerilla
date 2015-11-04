## Launch Guerilla

### Start Redis

Navigate to the Guerilla project directory and start the redis server:

`redis-server`

### Install NPM Packages

Navigate to the Guerilla project directory and run:

`npm install`

### Start Guerilla

Navigate to the Guerilla project directory and start the node server.

If the --config option is absent the config file defaults to ```./config/{master|worker}/config.json```

Master: `node server.js --master [--config configFilePath]`

Worker: `node server.js --worker [--config configFilePath]`

Environment variables in the configFilePath of the form %EnvVar% will be resolved. Undefined variables cause a startup exception.

