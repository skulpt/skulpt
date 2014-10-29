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

* github: Lots of good discussion happens around pull requests and bug reports
* [Mailing list](https://groups.google.com/forum/#!forum/skulpt)
* IRC channel: [#skulpt](http://webchat.freenode.net/?channels=skulpt)
* Blog: Some stuff about getting started is on [Brad's blog](http://reputablejournal.com)

## Adding new features

This section includes advice on how to build new features for the project & what kind of process it includes.

* First you should make a Fork. If you have never made a fork before please read this [github help article](https://help.github.com/articles/fork-a-repo)
* Check out the document HACKING.rst  Although its a work in progress, it contains valuable information about Skulpt and how it is structured, some of the 
  naming conventions, and information to help you understand how it all works.
* Create a feature branch using this command `git checkout -b feature_branch_name`
* Once you have added a new feature make sure you develop some test cases and add them to the test bank. Even better would be to write the failing test first. 
  You can add a test by copying the unit-test template file `./test/unit_tmpl.py` to `./test/unit` and give it a descriptive name. Make sure the functions in 
  your test class start with `test`. [Here](https://docs.python.org/2/library/unittest.html) is some documentation on the unittest module (not everything is 
  implemented in skulpt).
* Before submitting a pull request please make sure you run ``./skulpt test`` and ``./skulpt dist`` this checks that there are no regressions.  
  We have an automatic system to do regression testing, but if your pull request fails it is certain that it will not be accepted. 
* Now you can push this branch to your fork on github (you can do this earlier too) with this command `git push -u origin feature_branch_name`. And create a Pull Request on github.
* If the master branch gets updated before your pull request gets pulled in. You can do a `rebase` to base your commits off the new `master`. With a command 
  that looks like `git rebase upstream/master`. Make sure you do a __force__ push to your branch `git push --force` because you've rewritten history, and all 
  your commits will appear in two fold if you don't

We try to get to pull requests in a very timely way so they don't languish. Nothing is more frustrating than a project that just leaves pull requests sitting there for ages. Usually we get to them in a one or two days.

### In short: TL;DR

* fork: (on github)
* branch: `git checkout -b feature_branch_name`
* add unit-test
* commit: `git commit -m 'failing test'` (you can do this more often)
* write code 
* test: `./skulpt.py test` and `./skulpt.py dist`
* commit: `git commit -m 'implement fix'` (you can do this more often)
* push: `git push -u origin feature_branch_name`
* pull-request: (on github) 




## Coding Style and Conventions

In summer of 2014, we adopted the following style and conventions for our code:

* Braces:  One True Brace style -- that means open braces go on the same line as the
if/function/while/for statement, not on the line after.
* Curly braces __everywhere__ Yes, even if it is only a one line body of an if you should
use curly braces to clearly define every block.
* Use double quotes for strings everywhere.
* indent: 4 spaces
* combine your variable declarations at the top. (if you don't agree read this: http://code.tutsplus.com/tutorials/javascript-hoisting-explained--net-15092)
* make it pass jshint as much as possible
  * dangling underscores are ok we use them because we run into a lot of reserved words.
  * don't worry about the `'use strict';` we should add that to the compiler
  * we use a lot of bitwise ops so we can ignore those too
* Avoid accessing properties with array notation `['{a}']` use dot notation where possible.
* Don't use jQuery or create other third party library dependencies.  If you think you have
a really good reason to introduce said dependency then bring it up for discussion.  There
is also no reason to reinvent the wheel.

There may very well be things I have not covered in this list, but those will be
quickly revealed to you by the jshint program.

Our Travis script will run jshint over all the source.  You should run jshint as well.  
Many editors and IDEs do this automatically for you -- Atom, PyCharm, TextMate has a
nice plugin called JSLintMate.  You can easily install [jshint](http://jshint.org) using the ``npm`` package manager that comes with [node](http://nodejs.org).

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
