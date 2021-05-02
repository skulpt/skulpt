---
layout: default
title: "Using Skulpt on your site"
---
 
<div class="panel callout">  
    <h1>Get Started with Skulpt</h1>

    <p>Getting Started with Skulpt is easy!</p>
    <ul>
        <li><a href="#embed">Embed skulpt</a> into your existing webpage or blog</li>
        <li><a href="#html">Add skulpt directly to your HTML</a> for a custom integration</li>
        <li> For even more control, teach Skulpt to <a href="#modules">import your own custom modules</a></li>
    </ul>
    <p>Need some inspiration for a project? Just want to learn or teach Python? Head over to the <a href="gallery.html">Gallery</a> to see how great educational projects are using Skulpt</p>
</div>
    
<div data-magellan-expedition="fixed" class="floating-nav">
  <dl class="sub-nav">
    <dd data-magellan-arrival="embed"><a href="#embed">Embed Skulpt</a></dd>
    <dd data-magellan-arrival="html"><a href="#html">Skulpt + HTML</a></dd>
    <dd data-magellan-arrival="modules"><a href="#modules">Custom Modules</a></dd>
    <dd class="right"><a href="#">Top</a></dd>
  </dl>
</div>

<div class="row">
    <div class="small-12 columns">
        <h2 data-magellan-destination="embed" id="embed">Embed Skulpt</h2>
    </div>
</div>

If you want to embed a nice looking bit of code that your users can edit, Trinket.io can
help you with that!  You can put together the example on their site, and then generate the
code for an iframe that you can embed in your page.

<iframe src="https://trinket.io/embed/python/538012d3a6554c7945027aab" width="100%" height="356" frameborder="0" marginwidth="0" marginheight="0" allowfullscreen> </iframe>

Users can <strong><i class="fa fa-code-fork"></i> Remix </strong> your example and save their work to a free Trinket account.  

Use the Share button in the trinket above to get embed code. More information on embeeding trinkets [here](http://docs.trinket.io/getting-started).

<div class="row">
    <div class="small-12 columns">
        <h2 data-magellan-destination="html" id="html">Using Skulpt with HTML</h2>
    </div>
</div>

Want the compiled js to include in your site? Everything you need is in this zip: [skulpt-dist](https://github.com/skulpt/skulpt-dist/archive/master.zip). After adding `skulpt.js` or `skulpt-min.js` and `skulpt-stdlib.js` to your project, load the Javascript just before the {% raw %}</body>{% endraw %} closing tag.

{% gist c3495f93f57b333bcb2f %}


We're working on getting skulpt onto popular CDNs so you can load them straight from there.

<p>Once your HTML is loading Skulpt, here's a really simple example to get you going. You can copy and paste or grab the code from <a href="https://gist.github.com/4650616">this gist</a>.</p>

{% gist 4650616 %}

<div class="row">
    <div class="small-12 columns">
        <h2 data-magellan-destination="modules" id="modules">Using Custom Modules</h2>
    </div>
</div>

This new feature lets you create and host your own modules for use in Skulpt.  The
following gist shows how to include one of them in a page.

{% gist 20bd9105f11f2a164fc0 %}

<h3>Customizing modules after import</h3>

If you want to customize how a module behaves you can use the `onAfterImport` hook.  Here is a gist of how the trinket guys do it.

{% gist 8a5a833ee2a6a7d2c7ba %}


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
