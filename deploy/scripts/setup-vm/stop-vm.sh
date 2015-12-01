#!/usr/bin/env bash
vmrun stop ~/Documents/Virtual\ Machines.localized/OS\ X\ 10.10.vmwarevm/OS\ X\ 10.10.vmx
vmrun list | grep -q "Total running VMs: 0"
rc=$?; if [[ $rc != 0 ]]; then echo 'failure stop-vm.sh 1' $rc; exit $rc; fi
