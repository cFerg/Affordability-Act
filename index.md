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

<div class="home-actions">
  <a class="btn" href="{{ '/policy/bill-text/' | relative_url }}"><span>Read full bill</span></a>

  <a class="btn" href="{{ '/submit/' | relative_url }}"><span>Submit feedback</span></a>

  <button class="btn" id="toggle-sections" type="button" aria-expanded="false">
    <span>Show individual sections</span>
  </button>
</div>

<!-- Individual sections (hidden by default; toggled by JS) -->
<div id="sections-grid" hidden aria-live="polite" aria-busy="false">

  {% assign sections_data = site.data.sections %}

  {% if sections_data and sections_data.size > 0 %}
    {%- comment -%}
      Order goal:
      - Sections ordered by numeric "order"
      - Categories ordered by the first section number in that category
    {%- endcomment -%}

    {% assign ordered = sections_data | sort: "order" %}
    {% assign grouped = ordered | group_by: "category" %}

    {%- assign group_keys = "" | split: "" -%}
    {%- for g in grouped -%}
      {%- assign first_item = g.items | sort: "order" | first -%}
      {%- assign key = first_item.order | append: "||" | append: g.name -%}
      {%- assign group_keys = group_keys | push: key -%}
    {%- endfor -%}

    {%- assign group_keys = group_keys | sort -%}

    {%- for key in group_keys -%}
      {%- assign parts = key | split: "||" -%}
      {%- assign cat = parts[1] -%}
      {%- assign g = grouped | where: "name", cat | first -%}

      <h3 class="category-title">{{ g.name }}</h3>

      <div class="section-grid">
        {% assign items_sorted = g.items | sort: "order" %}
        {% for s in items_sorted %}
          <div class="section-card">
            <div class="section-card__title">{{ s.sectionTitle }}</div>
            <a class="btn" href="{{ s.url | relative_url }}"><span>Open</span></a>
          </div>
        {% endfor %}
      </div>
    {%- endfor -%}

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
    Have a proposal, correction, or example to add? Use the submission page to send feedback without needing an account.
  </p>
  <div class="home-actions" style="margin: 12px auto 0;">
    <a class="btn" href="{{ '/submit/' | relative_url }}"><span>Open submission form</span></a>
    <a class="btn" href="{{ site.github.repository_url | default: 'https://github.com/cFerg/Affordability-Act' }}"><span>View GitHub repo</span></a>
  </div>
</div>