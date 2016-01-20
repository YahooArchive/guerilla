#!/usr/bin/env bash
#TODO: make '$USER' below a variable from vars.yaml
ansible-playbook -i ../../config/ansible/production-inventory -u$USER --extra-vars "@../../config/ansible/vars.yml" -s clone-repo-locally.yml
