---
layout: default
title: Affordability Act
permalink: /
description: A public proposal to help keep everyday prices fair — by comparing costs to real wages and real conditions.
---

<div class="cover">
  <h1>{{ site.title }}</h1>
  <p class="muted">{{ page.description }}</p>
</div>

<div class="act-intro">
  <strong>What is this?</strong> This site hosts the public, version-controlled text of the Affordability Act.
  Read the full compiled bill or browse by category.
</div>

<hr class="home-divider">

<div class="home-actions home-actions--primary">
  <span class="halo halo-cta">
    <a class="btn btn-primary-cta" href="{{ '/policy/bill-text/' | relative_url }}"><span>Read full bill</span></a>
  </span>
</div>

<!-- Categories always shown; only multi-section categories accordion -->
<div class="home-sections" id="home-sections" aria-live="polite">
  {% assign sections_data = site.data.sections %}
  {% if sections_data and sections_data.size > 0 %}

    {%- assign keyed = "" | split: "" -%}
    {%- for s in sections_data -%}
      {%- assign ord = s.order | default: 9999 | plus: 0 -%}
      {%- assign ord_key = ord | prepend: "0000" | slice: -4, 4 -%}
      {%- assign cat = s.category | default: "Sections" -%}
      {%- assign title = s.sectionTitle | default: s.slug | default: "Section" -%}
      {%- assign url = s.url | default: "" -%}
      {%- if url == "" -%}
        {%- assign url = "/policy/sections/" | append: s.slug | append: "/" -%}
      {%- endif -%}
      {%- assign key = ord_key | append: "||" | append: cat | append: "||" | append: title | append: "||" | append: url -%}
      {%- assign keyed = keyed | push: key -%}
    {%- endfor -%}

    {%- assign keyed = keyed | sort -%}

    {%- comment -%}
      We build a structure by streaming sorted rows and grouping in Liquid.
      For each category we render:
        - a header button
        - an inner list of section buttons
      JS will auto-collapse categories with >1 section.
      Categories with exactly 1 section become direct links.
    {%- endcomment -%}

    {%- assign current_cat = "" -%}
    {%- assign current_items = "" -%}
    {%- assign current_count = 0 -%}

    {%- for row in keyed -%}
      {%- assign parts = row | split: "||" -%}
      {%- assign cat = parts[1] -%}
      {%- assign title = parts[2] -%}
      {%- assign url = parts[3] -%}

      {%- if cat != current_cat and current_cat != "" -%}
        <section class="cat-block" data-cat-block>
          <button class="cat-header" type="button" data-cat-toggle aria-expanded="true">
            <span class="cat-title">{{ current_cat }}</span>
            <span class="cat-meta" data-cat-meta></span>
            <span class="cat-chevron" aria-hidden="true">▾</span>
          </button>

          <div class="cat-body" data-cat-body>
            {{ current_items }}
          </div>
        </section>

        {%- assign current_items = "" -%}
        {%- assign current_count = 0 -%}
      {%- endif -%}

      {%- assign current_cat = cat -%}
      {%- capture add_item -%}
        <a class="btn section-btn" href="{{ url | relative_url }}"><span>{{ title }}</span></a>
      {%- endcapture -%}
      {%- assign current_items = current_items | append: add_item -%}
      {%- assign current_count = current_count | plus: 1 -%}

      {%- if forloop.last -%}
        <section class="cat-block" data-cat-block>
          <button class="cat-header" type="button" data-cat-toggle aria-expanded="true">
            <span class="cat-title">{{ current_cat }}</span>
            <span class="cat-meta" data-cat-meta></span>
            <span class="cat-chevron" aria-hidden="true">▾</span>
          </button>

          <div class="cat-body" data-cat-body>
            {{ current_items }}
          </div>
        </section>
      {%- endif -%}

    {%- endfor -%}

  {% else %}
    <div class="cover">
      <p class="muted">No sections found yet.</p>
    </div>
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