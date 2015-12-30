#!/usr/bin/env bash
#Setup the master vm. When done we still need to clone it, and deploy it to all physical hosts
#TODO: make 'bruceg' below a variable
ansible-playbook -i setup-master-inventory -ubruceg -s setup-master-vm.yml