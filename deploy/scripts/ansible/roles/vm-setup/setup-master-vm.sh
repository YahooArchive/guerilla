#!/usr/bin/env bash
#Setup the master vm. When done we still need to clone it, and deploy it to all physical hosts
ansible-playbook -i setup-master-inventory -u$USER -s setup-master-vm.yml