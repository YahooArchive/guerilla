## FAQs

### Can a checkout also make a pull request?
Q. I have a feature branch I don't want to merge yet, but I'd like to run some tests on the merge of my feature branch and
some other branch.

A. Use the optional "pull" option for the checkout step.  If there are conflicts the job will fail. Standard git 
<repository> and <refspecs> may be used. All the arguments in the pull: are appended to command line with per the 
following template


```
git pull --no-edit --commit <arguments to pull>

```

For example, given the following snippet:


```
"checkout": {
		"type": "javascript",
		"task": "git-checkout",
		"checkout_url": "git@yourpath.git",
		"branch": "develop",
		"pull": ["origin", "someFeatureBranch"]
	},
```

The resulting command line execution will be

```
git --no-edit --commit origin someFeatureBranch
```
