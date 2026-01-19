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
</div>

<div class="home-actions home-actions--center">
  <button class="btn" id="toggle-sections" type="button" aria-expanded="false">
    <span>Show individual sections</span>
  </button>
</div>

<!-- Individual sections (hidden by default; toggled by JS) -->
<div id="sections-grid" hidden aria-live="polite" aria-busy="false">
  {% assign sections_data = site.data.sections %}

  {% if sections_data and sections_data.size > 0 %}

    {%- assign keyed = "" | split: "" -%}

    {%- for s in sections_data -%}
      {%- if s.slug or s.url or s.sectionTitle -%}
        {%- assign ord = s.order | default: 9999 | plus: 0 -%}
        {%- assign ord_key = ord | prepend: "0000" | slice: -4, 4 -%}
        {%- assign cat = s.category | default: "Sections" -%}
        {%- assign title = s.sectionTitle | default: s.slug | default: "Section" -%}
        {%- assign url = s.url | default: "" -%}
          {%- if url == "" -%}
            {%- assign url = "/policy/sections/" | append: s.slug | append: "/" -%}
          {%- endif -%}
        {%- assign key = ord_key | append: "||" | append: cat | append: "||" | append: title | append: "||" | append: url -%}
      {%- else -%}
        {%- assign filename = s -%}
        {%- assign slug = filename | replace: ".md", "" -%}
        {%- assign ord = slug | slice: 0, 2 | plus: 0 -%}
        {%- assign ord_key = ord | prepend: "0000" | slice: -4, 4 -%}
        {%- assign cat = "Sections" -%}
        {%- assign title = slug | replace: "_", " " | replace: "-", " " -%}
        {%- assign url = "/policy/sections/" | append: slug | append: "/" -%}
        {%- assign key = ord_key | append: "||" | append: cat | append: "||" | append: title | append: "||" | append: url -%}
      {%- endif -%}

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

  {% endif %}
</div>

<hr class="home-divider">

<div class="cover">
  <h2>Contribute</h2>
  <p class="muted">
    Help keep the project online and accessible. Donations can support domain costs, hosting, outreach materials, and future submission tooling.
  </p>
  <div class="home-actions home-actions--center" style="margin: 12px auto 0;">
    <a class="btn" href="{{ '/donate/' | relative_url }}"><span>Donate</span></a>
    <a class="btn" href="{{ '/submit/' | relative_url }}"><span>Send feedback</span></a>
    <a class="btn" href="{{ site.github.repository_url | default: 'https://github.com/cFerg/Affordability-Act' }}"><span>View GitHub repo</span></a>
  </div>
</div>