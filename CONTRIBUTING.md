# CONTRIBUTE #

This is the contribute.md of our project. Great to have you here. Here are a few ways you can help make this project better!


## Team members

* [Brad Miller](https://github.com/bnmnetp) -- Current maintainer
* [Scott Rixner](https://github.com/rixner)
* [Marie Chatfield](https://github.com/mchat)
* [Albert-Jan Nijburg](https://github.com/albertjan)
* [Bob LaCatena](https://github.com/blacatena)
* [David Holmes](https://github.com/david-geo-holmes)
* [Charles Severance](https://github.com/csev)
* [Scott Graham](https://github.com/sgraham) -- although not active at the moment, Scott is the father of Skulpt

## Learn & listen

This section includes ways to get started with your open source project. Include links to documentation and to different communication channels: 

* github:  Lots of good discussion happens around pull requests and bug reports
* [Mailing list](https://groups.google.com/forum/#!forum/skulpt)
* IRC channel: [#skulpt](http://webchat.freenode.net/?channels=skulpt)
* Blog: Some stuff about getting started is on http://reputablejournal.com

## Adding new features

This section includes advice on how to build new features for the project & what kind of process it includes. 

* First you should make a Fork.  If you have never made a fork before please read this [github help article](https://help.github.com/articles/fork-a-repo)
* Once you have added a new feature make sure you develop some test cases and add them to the test bank. Even better would be to write the failing test first. The easy way to do this is to run `m nrt` (make sure you have either vim installed or the `EDITOR` environment variable set) which creates a new test file, opens up an editor for you to create your tests, and then generates the expected output based on 'real python'
* Before submitting a pull request please make sure you run ``m test`` and ``m dist`` this checks that there are no regressions.  We have an automatic system to do regression testing, but if your pull request fails it is certain that it will not be accepted.
* push your changes to your fork and then use github to submit a pull request.


We try to get to pull requests in a very timely way so they don't languish.  Nothing is more frustrating than a project that just leaves pull requests sitting there for ages.  Usually we get to them in a one or two days.

## How to use the Jasmine testing framework.

This framework is used to perform unit testing on the exported Skulpt APIs.

The test may be launched in many browsers and in headless mode.

You should make sure that these tests run cleanly in addition to the Python suite tests.

You will need three terminals open as you develop.

Open the terminal where you submit your Skulpt build and test commands.

Update the Lineman dependencies for the Skulpt project (You will only need to do this once and update periodically):

```sh
$ npm install
```

Clean the Skulpt project (This is optional):

```sh
$ lineman clean
```

Build the Skulpt distribution:

```sh
$ ./skulpt.py dist -u
```

Open another terminal which will be used to watch the Jasmine test specifications.

Run Lineman so that it watches for changes to the test source:

```sh
$ lineman run
```

This terminal is now commited to watching the test source. Leave it running on your desktop.
Note: You may see a Warning: Unable to write "dist/skulpt.js" file (Error code: EACCES). This is normal.

Open another terminal which will be used to run the Jasmine framework.

Run the Jasmine specification testing framework:

```sh
$ lineman spec
```

The framework should open a browser at localhost:7357/3856 showing the results of the test specifications.

Leave the browser window open. Leave all the terminal windows open.

The tests should all be passing. Notice that the specification window has the options [Press ENTER to run tests; q to quit]. You should not need to press ENTER because the source code for the tests is being monitored.

Make your changes to the Skulpt product code and re-build the Skulpt distribution:

```sh
$ ./skulpt.py dist -u
```

The test results in the browser should alternate from green to red to green as the Skulpt output is deleted and rebuilt.

Update the test specifications in the spec folder.

The specification runner should automatically track specification changes and update the results window.

If you want to change the browser used for testing, you must update the launcher in `config/spec.json`.
Your launcher options are IE7, IE8, IE9, Firefox, Chrome, and PhantomJS.

If you would like to run the Jasmine test headless (not a conventional browser) then you must install PhantomJS:

```sh
$ sudo apt-get install phantomjs
```

You can verify the installation with:

```sh
$ phantomjs --version
```

Once you have PhantomJS installed, you may run the tests in headless mode:

```sh
$ lineman spec-ci
```

Note: You can get more information on Lineman operation by adding the _--verbose_ option to Lineman commands.

# Documentation

If documentation is your thing, have we got a job for you.  There are a few blog posts on how to write modules and work with skulpt but very little of the core is documented beyond the source.  Having some good documentation for developers would really help get more people involved.


# Community 
This section includes ideas on how non-developers can help with the project. Here's a few examples:

* You can help us answer questions our users have in the google group
* You can help build and design our website in doc
* You can help write blog posts about the project

* Create an example of the project in real world by building something or
showing what others have built. 
* Write about other people’s projects based on this project. Show how
it’s used in daily life. Take screenshots and make videos!



