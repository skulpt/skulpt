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
* Check out the document HACKING.rst  Although its a work in progress, it contains valueable information about Skulpt and how it is structured, some of the naming conventions, and information to help you understand how it all works.
* Once you have added a new feature make sure you develop some test cases and add them to the test bank. Even better would be to write the failing test first. The easy way to do this is to run `m nrt` (make sure you have either vim installed or the `EDITOR` environment variable set) which creates a new test file, opens up an editor for you to create your tests, and then generates the expected output based on 'real python'
* Before submitting a pull request please make sure you run ``m test`` and ``m dist`` this checks that there are no regressions.  We have an automatic system to do regression testing, but if your pull request fails it is certain that it will not be accepted.
* push your changes to your fork and then use github to submit a pull request.


We try to get to pull requests in a very timely way so they don't languish.  Nothing is more frustrating than a project that just leaves pull requests sitting there for ages.  Usually we get to them in a one or two days.


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



