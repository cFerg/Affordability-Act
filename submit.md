---
layout: default
title: Submit Feedback
permalink: /submit/
---

<div class="form-wrap">
  <div class="form-card">
    <h1 class="form-title">Send feedback</h1>
    <p class="form-subtitle muted">
      No GitHub account needed. Messages go straight to the project inbox.
    </p>

    <form class="aff-form" method="POST" action="https://api.affordact.com/feedback/submit">
      <!-- Category -->
      <div class="field">
        <label for="fb_kind">Feedback type <span class="req">*</span></label>
        <select id="fb_kind" name="topic" required>
          <option value="" selected disabled>Choose one…</option>
          <option value="Bill update / suggestion">Bill update / suggestion</option>
          <option value="Website bug">Website bug</option>
          <option value="Website feature suggestion">Website feature suggestion</option>
          <option value="Other">Other</option>
        </select>
        <div class="help muted">This helps route feedback faster.</div>
      </div>

      <!-- Bill selector (conditional) -->
      <div class="field" id="bill_picker_wrap" hidden>
        <label for="bill_picker">Which part of the bill? <span class="req">*</span></label>
        <select id="bill_picker">
          <option value="" selected disabled>Choose a category/section…</option>

          <!-- Populated from _data/sections.json at build time -->
          {% assign grouped = site.data.sections | group_by: "category" %}
          {% for g in grouped %}
            <optgroup label="{{ g.name }}">
              {% for s in g.items %}
                <option value="{{ s.category }} — {{ s.sectionTitle }}">{{ s.sectionTitle }}</option>
              {% endfor %}
              <option value="{{ g.name }} — Other">Other ({{ g.name }})</option>
            </optgroup>
          {% endfor %}

          <option value="Other">Other / not sure</option>
        </select>
        <div class="help muted">Optional: you can still describe it in your message.</div>
      </div>

      <!-- Hidden/visible “Section” field that gets filled when bill picker is used -->
      <div class="field">
        <label for="fb_section">Section / area (optional)</label>
        <input
          id="fb_section"
          name="section"
          type="text"
          placeholder="Example: 🏠 Housing & Land — Section 2"
          autocomplete="off"
        />
      </div>

      <!-- Name (required) -->
      <div class="field">
        <label for="fb_name">Name <span class="req">*</span></label>
        <input id="fb_name" name="name" type="text" placeholder="Example: Alex" autocomplete="name" required />
      </div>

      <!-- Email (required) -->
      <div class="field">
        <label for="fb_email">Email <span class="req">*</span></label>
        <input
          id="fb_email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
        <div class="help muted">We only use this to reply. We don’t publish it.</div>
      </div>

      <!-- Wants reply -->
      <div class="field checkbox">
        <label>
          <input type="checkbox" name="wantsUpdates" value="yes" checked />
          I’d like a reply / status update
        </label>
      </div>

      <!-- Message -->
      <div class="field">
        <label for="fb_message">Message <span class="req">*</span></label>
        <textarea
          id="fb_message"
          name="message"
          rows="9"
          required
          placeholder="Example: I noticed Section 2 might need clearer wording around… (include links if helpful)"
        ></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary-cta" type="submit"><span>Send</span></button>
      </div>

      <p class="form-fineprint muted">
        If you include personal info, please keep it minimal. For urgent issues, use a separate email thread.
      </p>
    </form>
  </div>
</div>