---
layout: default
title: Affordability Act
---

<div class="cover">
  <h1>{{ site.title }}</h1>
  <p class="muted">A model framework to align prices with wages and real conditions — built in public.</p>
</div>

<div class="act-intro">
  <strong>What is this?</strong> This site hosts the public, version-controlled text of the Affordability Act.
  Read the full compiled bill or browse individual sections.
</div>

<div class="home-actions">
  <a class="btn" href="{{ '/policy/bill-text/' | relative_url }}"><span>Read full bill</span></a>
  <button class="btn" type="button" id="toggle-sections" aria-expanded="false">
    <span>Show individual sections</span>
  </button>
</div>

<!-- Server-side fallback list from _data/sections.json -->
<div class="section-grid" id="sections-grid" hidden aria-live="polite" aria-busy="true">
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

<hr class="home-divider">

<div class="cover" id="contribute">
  <h2 style="margin-top:0">Contribute</h2>
  <p class="muted">Have feedback, corrections, or ideas? Pick what fits you best:</p>
  <div class="home-actions">
    <a class="btn" href="https://github.com/cFerg/Affordability-Act/issues/new/choose"><span>Open an Issue</span></a>
    <a class="btn btn--ghost" href="https://github.com/cFerg/Affordability-Act/discussions"><span>Start a Discussion</span></a>
    <a class="btn btn--ghost" href="{{ '/submit/' | relative_url }}"><span>Submit via Form</span></a>
    <a class="btn" href="https://github.com/sponsors/cFerg"><span>Donate / Sponsor</span></a>
  </div>
  <p class="muted" style="margin-top:10px">No GitHub account? Use the form — we’ll triage and attribute contributions as “community submissions.”</p>
</div>

<noscript>
  <p class="mono" style="margin-top:12px;color:#a9b4c0">
    JavaScript is disabled. You can read the compiled bill
    <a href="{{ '/policy/bill-text/' | relative_url }}">here</a>.
  </p>
</noscript>