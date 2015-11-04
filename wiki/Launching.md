## Launch Guerilla

### Start Redis

Navigate to the Guerilla project directory and start the redis server:

`redis-server`

### Install NPM Packages

Navigate to the Guerilla project directory and run:

`npm install`

### Start Guerilla

Navigate to the Guerilla project directory and start the node server.

#### Specifying the Config file

if a --config option is present that file will be used as the configuration file. 

Otherwise if starting the master and the environment variable GuerillaConfigFileMaster is present then its value will be used for the config file.
 
Otherwise if starting the worker and the environment variable GuerillaConfigFileWorker is present then its value will be used for the config file.

Note: for the above 3 cases ~ and relative paths are allowed in the path.

Otherwise the config file defaults to ```./config/{master|worker}/config.json```

#### Starting syntax

Master: `node server.js --master [--config configFilePath]`

Worker: `node server.js --worker [--config configFilePath]`
