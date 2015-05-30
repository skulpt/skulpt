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
 
     <div class="small-12 columns">

 <h2>Skulpt in the Wild</h2>
    <p>
        <ul>
            <li><a href="http://interactivepython.org/courselib/static/thinkcspy/index.html"> How to Think like a Computer
                Scientist: Interactive Edition</a></li>
            <li><a href="http://interactivepython.org/courselib/static/pythonds/index.html"> Problem Solving with Algorithms
                and Data Structures using Python</a></li>
            <li><a href="http://www.pythonlearn.com/">PythonLearn</a></li>
            <li><a href="https://online.dr-chuck.com/">Dr. Chuck Online</a></li>
            <li><a href="http://www.codeskulptor.org">CodeSkulptor</a></li>
            <li><a href="https://trinket.io/">trinket</a></li>
            <li><a href="http://www.geometryzen.org">Geometry Zen</a></li>
            <li><a href="http://www.evaluzio.net">Evaluzio</a></li>
        </ul>
    </p>
    <p>If you have a project that uses skulpt and would like me to link to it here, let me know on our github page.</p>

    <h2>Skulpt on <a href="http://www.coursera.org">Coursera</a></h2>
    <p>
        <ul>
            <li><a href="https://www.coursera.org/course/interactivepython">An Introduction to Interactive Programming in Python</a></li>
            <li><a href="https://www.coursera.org/course/pythonlearn">Programming for Everybody</a></li>
        </ul>
    </p>
     
     </div>
</div>