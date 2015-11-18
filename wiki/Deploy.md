## Deploy

"Deploy" refers to deploying Guerilla on a farm of servers.

We support using PM2 to deploy and manage the distributed farm of servers.

###Philosophy

We prefer to deploy with VirtualMachines to ease the setup.

We Want our VMs to be largely stateless-we want to be able to replace them and not lose stored data. We have the stateful 
Guerilla files stored in the Host's file system by utilizing the config files "data_dir" parameter. A sample vmware vmrun
command is 

```vmrun addSharedFolder ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx hostDataDir ~/Documents/sharing/guerilla/reasonfeed-vm/DataDir```

```vmrun setSharedFolderState ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx hostDataDir ~/Documents/sharing/guerilla/reasonfeed-vm/DataDir writable```

where "reasonfeed-lm" is a unique identifier for the VM. This way >1 vm can share the host's file system. The vm will use
the path ```~/Desktop/VMware\ Shared\ Folders/hostDataDir/```


### Using PM2

### Key files

* ecosystem-master.json
* ecosystem-worker.json

These describe our two applications. We divide them in different ecosystem files so that we can distribute and manage 
master to a single server. There may be a better way to do this.


Setup
It is beyond our scope to setup PM2. Refer to the PM2 website directions. Note that they recommend committing the set
of node modules to git to ensure that all of the servers are identical. A possible alternative is to use npm's shrinkwrap
feature.

Key notes:

* We setup .bashrc because PM2's remote usage is not interactive and therefore doesn't use .bash_profile
* PM2 requires a no-passphrase git ssh key.
* We setup path and Env Vars in .bashrc to point to our config files. They must be in .bashrc as pm2 uses a non-interactive shell
so .bash_profile is not used.
* We setup our configs  as a directory tree..,

Question: can our vms go to a single place for their output dir, and we map that to distinct subfolders on their host?


### Key PM2 commands

#### Setup

```pm2 deploy ecosystem-master.json dev setup```

```pm2 deploy ecosystem-worker.json dev setup```


#### Deploy the system 

```pm2 deploy ecosystem-master.json dev```

```pm2 deploy ecosystem-worker.json dev```


#### Start

```pm2 deploy ecosystem-master.json dev exec "pm2 start all"```

```pm2 deploy ecosystem-worker.json dev exec "pm2 start all"```

#### Update
updates then restarts or starts the application. Also starts pm2 if it isn't started.

```pm2 deploy ecosystem-master.json dev update```

```pm2 deploy ecosystem-worker.json dev update```

#### Display status

```pm2 deploy ecosystem-master.json dev exec "pm2 list"```

```pm2 deploy ecosystem-master.json dev exec "pm2 list"```

#### Stop a server

```pm2 deploy ecosystem-master.json dev exec "pm2 delete guerilla-master"```

```pm2 deploy ecosystem-worker.json dev exec "pm2 delete guerilla-worker"```