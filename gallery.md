---
layout: default
title: "Skulpt Project Gallery"
---

This is where information about projects that use Skulpt goes.

<!-- The following code will randomly choose a featured project each time gallery.html is generated
Ideally it would choose one each time the page loads but I haven't dug into that yet. -->

{% capture index %}{{ 'now' | date: '%S' | times: site.posts.size | divided_by: 60 }}{% endcapture %}

<div class="row">
{% for post in site.posts %}
    <div class="small-12 medium-6 large-4 columns">
        <a href="{{ post.link }}"><img src="{{ post.screenshot }}"></a>
        <h4><a href="{{ post.link }}">{{ post.title }}</a></h4>
        <p> {{ post.blurb }}
        </p>
    </div>

 {% endfor %}

     <div class="small-12 columns">

 <h2>Skulpt in the Wild</h2>
    <p>
        <ul>
            <li><a href="https://runestone.academy/runestone/static/fopp/index.html"> Foundations of Python Programming</a></li>
            <li><a href="https://runestone.academy/runestone/static/pythonds/index.html"> Problem Solving with Algorithms
                and Data Structures using Python</a></li>
            <li><a href="http://www.pythonlearn.com/">PythonLearn</a></li>
            <li><a href="https://online.dr-chuck.com/">Dr. Chuck Online</a></li>
            <li><a href="https://py3.codeskulptor.org">CodeSkulptor</a></li>
            <li><a href="https://trinket.io/">trinket</a></li>
            <li><a href="https://shrew.app">Code Shrew</a></li>
        </ul>
    </p>
    <p>If you have a project that uses skulpt and would like me to link to it here, let me know on our github page.</p>

    <h2>Skulpt on <a href="http://www.coursera.org">Coursera</a></h2>
    <p>
        <ul>
            <li><a href="https://www.coursera.org/learn/interactive-python-1">An Introduction to Interactive Programming in Python</a></li>
            <li><a href="https://www.coursera.org/course/pythonlearn">Programming for Everybody</a></li>
        </ul>
    </p>

     </div>
</div>