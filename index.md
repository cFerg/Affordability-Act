---
layout: default
title: Affordability Act
---

<div class="cover">
  <h1>Affordability Act</h1>
  <p>A model framework to align prices with wages and real conditions — built in public.</p>
</div>

<div class="act-intro">
  <strong>What is this?</strong> This site hosts the public, version-controlled text of the Affordability Act.
  Read the full compiled bill or browse individual sections.
</div>

<div class="home-actions">
  <a class="btn" href="{{ '/policy/bill-text/' | relative_url }}"><span>Click here to read the full bill</span></a>
  <a class="btn btn--ghost" id="toggle-sections" aria-expanded="false"><span>Show individual sections</span></a>
</div>

<!-- Server-side fallback list from _data/sections.json -->
<div class="section-grid" hidden aria-live="polite" aria-busy="true">
  {% if site.data.sections and site.data.sections.size > 0 %}
    {% for f in site.data.sections %}
      {% assign slug = f | replace: '.md','' %}
      {% assign pretty = slug | replace: '_',' ' | replace: '-',' ' %}
      <div class="section-card">
        <div class="section-card__title">{{ pretty | replace_regex: '^[0-9]+\\s*','' }}</div>
        <a class="btn" href="{{ '/policy/sections/' | append: slug | append: '/' | relative_url }}"><span>Open</span></a>
      </div>
    {% endfor %}
  {% endif %}
</div>

<noscript>
  <p class="mono" style="margin-top:12px;color:#a9b4c0">
    JavaScript is disabled. You can read the compiled bill
    <a href="{{ '/policy/bill-text/' | relative_url }}">here</a>.
  </p>
</noscript>