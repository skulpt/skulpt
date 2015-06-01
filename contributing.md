---
layout: default
title: "Contributing to Skulpt"
---

This is where information about contributing to Skulpt goes.

<h2>Helping out!</h2>

<p>Skulpt surely isn't done yet.</p>

<p>If you want to check out a list of bugs, or add to it, or see what's been
fixed recently, you can head over to the always-euphemistic-sounding <a
href="http://github.com/skulpt/skulpt/issues">issues page</a>.</p>

<p>If you are interested in contributing to skulpt in any way, check out this new <a href="https://github.com/skulpt/skulpt/blob/master/CONTRIBUTING.md">how to contribute</a> document.</p>

<p>If you'd like to chit-chat, <a href="http://groups.google.com/group/skulpt">there's a list for
that</a>.</p>

<p>And, if &quot;daring&quot; is your <em>middle</em> name, there's a wee bit of <a
href="static/developer.html">developer docs</a> (New and Improved!).</p>

### Contributors

Skulpt is developed by a long list of awesome developers.  We hope your name will go on this list as well!

<div class="row">
{% for contributor in site.github.contributors %}
  <div class="small-6 medium-4 large-3 columns">
      <p>
        <img src="{{ contributor.avatar_url }}" width="32" height="32" /> <a href="{{ contributor.html_url }}">{{ contributor.login }}</a>
        </p>
  </div>
{% endfor %}
<div>