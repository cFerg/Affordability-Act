---
layout: default
title: Affordability Act
permalink: /
description: A model framework to align prices with wages and real conditions — built in public.
---

<div class="cover">
  <h1>{{ site.title }}</h1>
  <p class="muted">{{ page.description }}</p>
</div>

<div class="act-intro">
  <strong>What is this?</strong> This site hosts the public, version-controlled text of the Affordability Act.
  Read the full compiled bill or browse individual sections.
</div>

<hr class="home-divider">

<div class="home-actions home-actions--primary">
  <a class="btn btn-primary-cta" href="{{ '/policy/bill-text/' | relative_url }}"><span>Read full bill</span></a>
  <a class="btn" href="{{ '/submit/' | relative_url }}"><span>Send feedback</span></a>
</div>

<div class="home-actions">
  <button class="btn" id="toggle-sections" type="button" aria-expanded="false">
    <span>Show individual sections</span>
  </button>
</div>

<!-- Individual sections (hidden by default; toggled by JS) -->
<div id="sections-grid" hidden aria-live="polite" aria-busy="false">

  {% assign sections_data = site.data.sections %}

  {% if sections_data and sections_data.size > 0 %}
    {%- comment -%}
      Robust numeric ordering (prevents 10/11 appearing before 1..9):
      Build padded keys: 0001, 0010, 0011 ...
      Then stream and open/close category grids as category changes.
    {%- endcomment -%}

    {%- assign keyed = "" | split: "" -%}
    {%- for s in sections_data -%}
      {%- assign ord = s.order | plus: 0 -%}
      {%- assign ord_key = ord | prepend: "0000" | slice: -4, 4 -%}
      {%- assign key = ord_key | append: "||" | append: s.category | append: "||" | append: s.sectionTitle | append: "||" | append: s.url -%}
      {%- assign keyed = keyed | push: key -%}
    {%- endfor -%}
    {%- assign keyed = keyed | sort -%}

    {%- assign current_cat = "" -%}
    {%- for row in keyed -%}
      {%- assign parts = row | split: "||" -%}
      {%- assign cat = parts[1] -%}
      {%- assign title = parts[2] -%}
      {%- assign url = parts[3] -%}

      {%- if cat != current_cat -%}
        {%- if current_cat != "" -%}</div>{%- endif -%}
        <h3 class="category-title">{{ cat }}</h3>
        <div class="section-grid">
        {%- assign current_cat = cat -%}
      {%- endif -%}

      <div class="section-card">
        <div class="section-card__title">{{ title }}</div>
        <a class="btn" href="{{ url | relative_url }}"><span>Open</span></a>
      </div>

    {%- endfor -%}
    {%- if current_cat != "" -%}</div>{%- endif -%}

  {% else %}
    <!-- Fallback: build list from pages if _data/sections.json isn't available -->
    {% assign sect_pages = site.pages | where_exp: "p", "p.path contains 'policy/sections/'" %}
    {% assign sect_pages = sect_pages | sort: "path" %}

    <h3 class="category-title">Sections</h3>
    <div class="section-grid">
      {% for p in sect_pages %}
        {% assign slug = p.url | split: '/' | last | default: p.name | replace: '.html','' %}
        <div class="section-card">
          <div class="section-card__title">{{ p.title | default: slug | replace: "_"," " | replace: "-"," " }}</div>
          <a class="btn" href="{{ p.url | relative_url }}"><span>Open</span></a>
        </div>
      {% endfor %}
    </div>
  {% endif %}

</div>

<hr class="home-divider">

<div class="cover">
  <h2>Contribute</h2>
  <p class="muted">
    Help keep the project online and accessible. Donations can support domain costs, hosting, outreach materials, and future submission tooling.
  </p>
  <div class="home-actions" style="margin: 12px auto 0;">
    <a class="btn" href="{{ '/donate/' | relative_url }}"><span>Donate</span></a>
    <a class="btn" href="{{ '/submit/' | relative_url }}"><span>Send feedback</span></a>
    <a class="btn" href="{{ site.github.repository_url | default: 'https://github.com/cFerg/Affordability-Act' }}"><span>View GitHub repo</span></a>
  </div>
</div>