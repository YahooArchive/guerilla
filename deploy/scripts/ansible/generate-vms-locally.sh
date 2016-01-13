#!/usr/bin/env bash
vmrun stop ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx
#we fail if any vms are running-too strong. TODO-only stop if our vm is running. we can look for the vm name in vmrun list
vmrun list | grep -q "Total running VMs: 0"
rc=$?; if [[ $rc != 0 ]]; then echo 'failure ${0} 1' $rc; exit $rc; fi
#We don't error
rm -rf /Volumes/startech/vm3
rc=$?; if [[ $rc != 0 ]]; then echo 'failure ${0} 2'; exit $rc; fi
vmrun clone ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx  /Volumes/startech/vm3/GuerillaVMv3.vmx full
rc=$?; if [[ $rc != 0 ]]; then echo 'failure ${0} 3'; exit $rc; fi
vmrun clone /Volumes/startech/vm3/GuerillaVMv3.vmx /Volumes/startech/vm3/GuerillaVMv3-linked1.vmx linked
rc=$?; if [[ $rc != 0 ]]; then echo 'failure ${0} 4'; exit $rc; fi
vmrun clone /Volumes/startech/vm3/GuerillaVMv3.vmx /Volumes/startech/vm3/GuerillaVMv3-linked2.vmx linked
rc=$?; if [[ $rc != 0 ]]; then echo 'failure ${0} 5'; exit $rc; fi