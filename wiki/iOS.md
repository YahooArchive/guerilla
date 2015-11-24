## Configure for iOS

### Install XCode + Command Line Tools

Install the latest version of Xcode from the App Store. Once it's downloaded, launch Xcode and accept the terms and conditions. Xcode will then install the command line tools.

### Additional Notes

Make sure you have:

- the appropriate iOS licenses, certificates and provisioning profiles
- put your Mac into developer mode by manually installing atleast one application on a device via Xcode


#### Simulators
At startup, each worker scans the available IOS Simulators on its OS by runing ```xcrun simctl list```. From the resulting output it 
synthesizes additional worker devices which are added to those already in the worker's config.json. E.G from the following output from running```xcrun simctl list``` 


```
$xcrun simctl list
   == Device Types ==
...
   iPhone 6 Plus (com.apple.CoreSimulator.SimDeviceType.iPhone-6-Plus)
...
   == Runtimes ==
   iOS 8.4 (8.4 - 12H141) (com.apple.CoreSimulator.SimRuntime.iOS-8-4)
   iOS 9.1 (9.1 - 13B137) (com.apple.CoreSimulator.SimRuntime.iOS-9-1)
...
   == Devices ==
   -- iOS 8.4 --
...
       iPhone 6 (D1B55351-8D27-4803-BBC5-DD0EDB4AC3F0) (Shutdown)
...
   -- iOS 9.1 --
...
       iPhone 6 (F0FFDBFA-7BDC-4577-82F8-816D09797AC7) (Shutdown)
 ...
 
```

Guerilla will create synthetic devices as if the worker's config.json had the following device entries

```

		{   "tag": "ios-simulator,OS=8.4,name=iPhone 6",
		    "platform": "ios",
		    "name:": "ios-simulator iPhone 6 (8.4)",
		    "identifier": "D1B55351-8D27-4803-BBC5-DD0EDB4AC3F0",
		    "OS": "8.4",
		    "simulator": "true",
		    "destination": "OS=8.4,name=iPhone 6"
		},
		{   "tag": "ios-simulator,OS=9.1,name=iPhone 6",
		    "platform": "ios",
		    "name:": "ios-simulator iphone 6 (8.4)",
		    "identifier": "F0FFDBFA-7BDC-4577-82F8-816D09797AC7",
		    "OS": "9.1":
		    "simulator": "true",
		    "destination": "OS=8.4,name=iPhone 6"
		}	
			...
```

These synthesized entries are visible along with the standard config device entries via the web ui for each worker.