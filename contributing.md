---
layout: default
title: "Contributing to Skulpt"
---

This is where information about contributing to Skulpt goes.

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