#!/usr/bin/env bash
# $1 = sourcevmx
# $2 = target_vm_dir
# $3 = targetvmx
# $4 = targetlinked1vmx
# $5 = targetlinked2vmx
# $6 = 'check'
sourcevmx=$1
target_vm_dir=$2
targetvmx=$3
targetlinked1vmx=$4
targetlinked2vmx=$5
checkparm=$6
#We are dangerously deleting directories so we require exactly 3 parmaters, and the 3rd one must be "check"
if [[ "$#" -ne 6 ]]; then
	echo "Illegal number of parameters"
	exit 1
fi
if [ "$checkparm" != "check" ]; then 
	echo "6th argument must = 'check'"
	exit 1
fi
vmrun stop $sourcevmx
#we fail if any vms are running-too strong. TODO-only stop if our vm is running. we can look for the vm name in vmrun list
vmrun list | grep -q "Total running VMs: 0"
rc=$?; if [[ $rc != 0 ]]; then echo "failure ${0} Found running vms. Exit them and retry 1" $rc; exit $rc; fi

rm -rf $target_vm_dir
rc=$?; if [[ $rc != 0 ]]; then echo "failure ${0} removing $target_vm_dir 2"; exit $rc; fi

vmrun clone $sourcevmx $targetvmx full
rc=$?; if [[ $rc != 0 ]]; then echo "failure ${0} $sourcevmx $targetvmx full"; exit $rc; fi

vmrun clone $targetvmx targetlinked1vmx linked
rc=$?; if [[ $rc != 0 ]]; then echo "failure ${0} vmrun clone $targetvmx targetlinked1vmx linked"; exit $rc; fi

vmrun clone $targetvmx targetlinked2vmx linked
rc=$?; if [[ $rc != 0 ]]; then echo "failure ${0} vmrun clone $targetvmx targetlinked2vmx linked"; exit $rc; fi