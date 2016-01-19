#!/usr/bin/env bash
#TODO: make '$USER' below a variable from vars.yaml
ansible-playbook -i production-inventory -u$USER -s deploy-vms.yml
