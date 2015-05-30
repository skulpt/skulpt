---
layout: default
title: "Skulpt Project Gallery"
---

This is where information about projects that use Skulpt goes.

<!-- The following code will randomly choose a featured project each time gallery.html is generated
Ideally it would choose one each time the page loads but I haven't dug into that yet. -->

{% capture index %}{{ 'now' | date: '%S' | times: site.posts.size | divided_by: 60 }}{% endcapture %}
{% for post in site.posts offset:index limit:1 %}
<h2>Featured Project</h2>
<div class="row">
    <div class="small-12 medium-4 columns">
        <p>
          <img src="{{ post.screenshot }}">
        </p>
    </div>
    <div class="small-12 medium-8 columns">
        <h3>{{ post.title }}</h3>
        <p> {{ post.blurb }}</p>
        <p><a href="{{ post.link }}">Learn More</a></p>
    </div>
</div>
{% endfor %}
 
<div class="row">
{% for post in site.posts %}
    <div class="small-12 medium-6 large-4 columns">
        <img src="{{ post.screenshot }}">
        <h4>{{ post.title }}</h4>
        <p> {{ post.blurb }}
        </p>
    </div>
    
 {% endfor %}
</div>