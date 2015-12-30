#!/usr/bin/env bash
#TODO: make 'bruceg' below a variable
ansible-playbook -i production-inventory -ubruceg -s run-generate-vms-locally.yml
