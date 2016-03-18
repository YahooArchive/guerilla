## Launch Guerilla

### Start Redis

Navigate to the Guerilla project directory and start the redis server:

```sh
npm start-redis
# or the following legacy way
# redis-server
```

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

#### Saving Temp Files
For debugging purposes it may be useful to save Guerilla's temporary directory. This is where git clones reside and building occurs.
The temporary directory is in the OS's
temporarily file location, and is normally deleted at program exit. With the --saveTempFiles option, the temporary directory
will not be explictly deleted at program exit. Additionally the location of the directory is logged to the standard output as in
```The temporary directory is: /var/folders/kn/86m_td_94555_yn37ch2zvdr002j1q/T/guerillatemp1151016-20048-13cuks0``` Note that 
the temporary directory always has the ```guerillatemp``` prefix.

Remember that each time Guerilla processes a job it forks a new worker to execute it, and that worker will have its own distinct 
temporary directory.

#### Starting syntax

Master:
```sh
npm start-master
# or the following legacy way
# node server.js --master [--config configFilePath] {--saveTempFiles}`
```

Worker:
```sh
npm start-worker
# or the following legacy way
# node server.js --worker [--config configFilePath] {--saveTempFiles}
```