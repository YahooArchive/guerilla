#!/usr/bin/env bash
# TODO: parameterize
# TODO: Get Ansible git to work
rm -rf /Users/bruceg/repos/ansible-checkout/bruceg-yahoo-guerilla
git clone --single-branch -b deploy-nyc1 --depth 1 --recurse-submodules git@git.corp.yahoo.com:bruceg/yahoo-guerilla.git /Users/bruceg/repos/ansible-checkout/bruceg-yahoo-guerilla