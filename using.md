---
layout: default
title: "Using Skulpt on your site"
---
 
This is where information about using Skulpt on your site goes.


<h2>Getting Started</h2>

<p>If you want to embed a nice looking bit of code that your users can edit, Trinket.io can
help you with that!  You can put together the example on their site, and then generate the
code for an iframe that you can embed in your page!</p>

<iframe src="https://trinket.io/embed/python/538012d3a6554c7945027aab" width="100%" height="356" frameborder="0" marginwidth="0" marginheight="0" allowfullscreen> </iframe>


<p>If you want to roll your own page, Getting started with skulpt on your own page can seem a little intimidating, but here's a really simple example that
gets you going. You can copy and paste or grab the code from <a href="https://gist.github.com/4650616">this gist</a>.</p>

<script src="https://gist.github.com/bnmnetp/4650616.js"></script>


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

<h2>Third Party Modules</h2>
This new feature lets you create and host your own modules for use in Skulpt.  The
following gist shows how to include one of them in a page.

<script src="https://gist.github.com/bnmnetp/20bd9105f11f2a164fc0.js"></script>

<h2>Customizing modules after import</h2>
<p>If you want to customize how a module behaves you can use the ``onAfterImport`` hook.  Here is a gist of how the trinket guys do it.</p>
<script src="https://gist.github.com/bzwheeler/8a5a833ee2a6a7d2c7ba.js"></script>


## Getting Skulpt

Want the compiled js to include in your site? Grab the zip: [skulpt-dist](https://github.com/skulpt/skulpt-dist/archive/master.zip)

We're working on getting skulpt onto popular CDNs so you can load them straight from there.

<div class="row">
<div class="small-12 columns">
<h3>Releases</h3>
</div>
{% for release in site.github.releases %}
  <div class="small-12 columns">
      <h4><a href="{{ release.url }}">{{ release.tag_name }}</a></h4>
      <p>
        {{ release.body }}
      </p>
  </div>
{% endfor %}
<div>