## Guerilla and Virtual Machines

Guerilla does not supply a virtual machine. This section simply discusses why you might want to use a virtual machine, and some considerations that apply.

You might want to use a virtual machine to:
 
- Scale out a farm of Guerilla machines for easier maintenance
- Drive multiple devices simultaneously with one physical OS/X machine. Under OS/X, each OS instance can only drive a single iOS device. With VMs, a single physical OS/X machine can drive 1, 2 or 3 iOS devices.

The advantage of a VM is that you are using a tested instance that works. It can be a starting point which you further customize. Typically this will be a faster install as it includes the entire environment (XCode, Android Studio, SDK configurations, certificates, etc...) as well as the Guerilla components.

Our experiences have shown that when using a 16GB machine with iOS devices, 2 instances of Guerilla seems to be the practical limit.