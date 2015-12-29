#!/usr/bin/env bash
vmrun stop ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx
vmrun clone ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx  /Volumes/startech/vm3/GuerillaVMv3.vmx full
rc=$?; if [[ $rc != 0 ]] then echo 'failure generate-vms.sh 1'; exit $rc; fi
vmrun clone /Volumes/startech/vm3/GuerillaVMv3.vmx /Volumes/startech/vm3/GuerillaVMv3-linked1.vmx linked
rc=$?; if [[ $rc != 0 ]] then echo 'failure generate-vms.sh 2'; exit $rc; fi
vmrun clone /Volumes/startech/vm3/GuerillaVMv3.vmx /Volumes/startech/vm3/GuerillaVMv3-linked2.vmx linked
rc=$?; if [[ $rc != 0 ]] then echo 'failure generate-vms.sh 3'; exit $rc; fi