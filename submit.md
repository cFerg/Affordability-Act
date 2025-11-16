---
layout: default
title: Submit Feedback
---

<div class="cover">
  <h1>Submit feedback</h1>
  <p class="muted">
    This form creates a public tracker entry so changes are transparent.
    Contact details are stored privately and only used by maintainers if follow-up is needed.
  </p>
</div>

<form id="aa-submit" action="https://api.affordact.com/feedback" method="POST" style="margin-top:16px">
  <!-- Honeypot (spam guard) -->
  <input type="text" name="website" tabindex="-1" autocomplete="off" style="display:none">

  <label class="mono">Your name (optional)</label>
  <input name="name" type="text" autocomplete="name"
         style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">
    Email (optional, kept private)
  </label>
  <input name="email" type="email" autocomplete="email"
         placeholder="Used only if maintainers need to contact you"
         style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">
    Other contact (optional, kept private)
  </label>
  <input name="contact" type="text"
         placeholder="GitHub username, website, social handle, etc."
         style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">Topic</label>
  <select name="topic"
          style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">
    <option>Correction</option>
    <option>Suggestion</option>
    <option>Question</option>
    <option>General feedback</option>
  </select>

  <label class="mono" style="display:block;margin-top:12px">Section (optional)</label>
  <input name="section" type="text" placeholder="e.g., 02_Housing_and_Land_Use.md"
         style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">Message</label>
  <textarea name="message" rows="6" required
            style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1"
            placeholder="Describe your idea or correction…"></textarea>

  <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:0.9rem">
    <input type="checkbox" name="updates_opt_in" value="yes" style="accent-color:#4f9cff">
    <span class="mono">Send me occasional email updates about this submission</span>
  </label>

  <button class="btn" type="submit" style="margin-top:12px"><span>Send</span></button>
</form>

<p class="muted" style="margin-top:8px">
  Note: The main text of your message is posted publicly so others can see what’s been suggested.
  Contact information stays in a private record only approved maintainers can view.
</p>