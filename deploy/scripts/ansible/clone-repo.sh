#!/usr/bin/env bash
rm -rf ~/repos/ansible-checkout/bruceg-yahoo-guerilla
git clone --single-branch -b deploy-nyc1 --depth 1 --recurse-submodules git@git.corp.yahoo.com:bruceg/yahoo-guerilla.git ~/repos/ansible-checkout/bruceg-yahoo-guerilla