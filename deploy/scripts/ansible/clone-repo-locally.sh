#!/usr/bin/env bash
# TODO: parameterize
# TODO: Get Ansible git to work
# parameters:
# $1 = git_repo
# $2 = git_ansible_checkout_dir
# $3 = 'check'
git_repo=$1
git_ansible_checkout_dir=$2
checkparm=$3
#We are dangerously deleting directories so we require exactly 3 parmaters, and the 3rd one must be "check"
if [[ "$#" -ne 3 ]]; then
	echo "Illegal number of parameters"
	exit 1
fi
if [ "$checkparm" != "check" ]; then 
	echo "3rd argument must = 'check'"
	exit 1
fi
rm -rf $git_ansible_checkout_dir
git clone --single-branch -b deploy-nyc1 --depth 1 --recurse-submodules $git_repo $git_ansible_checkout_dir