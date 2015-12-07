# Deploy

"Deploy" refers to deploying Guerilla on a farm of servers.

We support using PM2 to deploy and manage the distributed farm of servers.

##Approach

We prefer to deploy with VirtualMachines to ease the setup.

We Want our VMs to be largely stateless-we want to be able to replace them and not lose stored data. We have the stateful 
Guerilla files stored in the Host's file system by utilizing the config files "data_dir" parameter. A sample vmware vmrun
command is 

```vmrun addSharedFolder ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx hostDataDir ~/Documents/sharing/guerilla/reasonfeed-vm/DataDir```

```vmrun setSharedFolderState ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx hostDataDir ~/Documents/sharing/guerilla/reasonfeed-vm/DataDir writable```

where "reasonfeed-lm" is a unique identifier for the VM. This way >1 vm can share the host's file system. The vm will use
the path ```~/Desktop/VMware\ Shared\ Folders/hostDataDir/```

We use Ansible to deploy the Virtual Machines to the host machines, and to execute any initial provisioning requirements.

We will run ansible from a "Controller" machine and we will refer to that machine as the "controller".

### Redis
We currently expect that Redis will be started automatically. We recommend using ```brew services start redis```. It is
outside of the our scope to install/startup Redis at this point (TODO-add as an Ansbile task).

###Ansible
Install Ansible via ```brew install ansible```

Update the deploy/scripts/ansible/production-inventory file

Verify that the ansible has ssh rights to each machine. (FLESH OUT).

Verify that you can access each ansible machine ```ansible all -i deploy/scripts/ansible/production-inventory -u{id} -a "/bin/echo hello"``` where {id} is a user that
has rights to the target machine.

Create your vms. We are currently using linked clones, as that has a smaller file footprint, and responds well to rsysnc
cloning. It has an undesirable side-effect of asking where the parent is the first time you start the linked vm, so this 
gets in the way of automation.

Ensure that fusion is not running on the target machines.

Deploy the vms via the script file deploy-vms.sh (cd to the ansible directory first).

start the vms up, and when prompted locate the parent .vmx file which ideally is in the same directory, and when prompted respond that the VM was copied.

We recommend setting the host machines user login to start vmfusion at startup via the System preferences- Users & Groups -> Login Items

Additionally have Fusion start the 2 vms each time VMFusion starts up via TOBEFILLEDIN



### Key Misc Notes

* We setup .bashrc because PM2's remote usage is not interactive and therefore doesn't use .bash_profile
* PM2 requires a no-passphrase git ssh key.
* We setup path and Env Vars in .bashrc to point to our config files. They must be in .bashrc as pm2 uses a non-interactive shell
so .bash_profile is not used.
* We expect a deploy/config/{hostName}/vmN directories under the project root, where {hostName} is the network addressable name
for the vm host computer., and vmN is vm1, vm2 etc... for the distinct vms. 
* We expect deploy/config/{hostName}/vmN/{configworker.json | confifigmaster.json} indicating if we should deply one or both
worker or masters to the specified vm.



### Using PM2

#### Key files

* ecosystem-master.json
* ecosystem-worker.json

These describe our two applications. We divide them in different ecosystem files so that we can distribute and manage 
master to a single server. There may be a better way to do this.

#### Setup
It is beyond our scope to setup PM2. Refer to the PM2 website directions. Note that they recommend committing the set
of node modules to git to ensure that all of the servers are identical. A possible alternative is to use npm's shrinkwrap
feature.

#### Key PM2 commands

##### Setup

```pm2 deploy ecosystem-master.json dev setup```

```pm2 deploy ecosystem-worker.json dev setup```


##### Deploy the system 

```pm2 deploy ecosystem-master.json dev```

```pm2 deploy ecosystem-worker.json dev```


##### Start

```pm2 deploy ecosystem-master.json dev exec "pm2 start all"```

```pm2 deploy ecosystem-worker.json dev exec "pm2 start all"```

##### Update
updates then restarts or starts the application. Also starts pm2 if it isn't started.

```pm2 deploy ecosystem-master.json dev update```

```pm2 deploy ecosystem-worker.json dev update```

##### Display status

```pm2 deploy ecosystem-master.json dev exec "pm2 list"```

```pm2 deploy ecosystem-master.json dev exec "pm2 list"```

##### Stop a server

```pm2 deploy ecosystem-master.json dev exec "pm2 delete guerilla-master"```

```pm2 deploy ecosystem-worker.json dev exec "pm2 delete guerilla-worker"```

###Sample checklist

1. Create the VM (Flesh out).
  1. Install android sdk
  2. Install xcode command line tools
  3. Install xcode
  4. blah blah 
1. Update deploy/ansible/produciton-inventory to add all hosts
1. Setup key based ssh for all hosts. (FLESH OUT-what id)
1. Designate a master machine and update ecosystem-master.json to include that server.
1. Update ecosystem-worker.json to add all hosts (TODO, remove redundancy wrt ansible hosts-have ansible update this perhaps)
1. Designate and install brew services on the redis machine. Set the machine to always start redis via ```brew services start redis```
Setup a backup strategy for the redis data file (EXPAND THIS).
1. Install Ansible on the "controller" machine that will run Ansible. 
1. run host-setup.sh on each host. (TODO, use ansible for this).

###References

*  pm2-
*  https://serversforhackers.com/an-ansible-tutorial
*  http://docs.ansible.com/ansible/playbooks_best_practices.html


###TODO
*  Lock down the node modules on each instance either by using shrinkwrap, or by checking in modules to git.
*  have current/next version support for both PM2 and for virtual machines. e.g. we should be able to push the next
version while the current is running.