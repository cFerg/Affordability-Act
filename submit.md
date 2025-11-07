---
layout: default
title: Submit Feedback
---

<div class="cover">
  <h1>Submit feedback</h1>
  <p class="muted">If you don’t have a GitHub account, you can use this form. We’ll review and post it as a community submission.</p>
</div>

<form action="https://formspree.io/f/your-id-here" method="POST" style="margin-top:16px">
  <label class="mono">Your name (optional)</label>
  <input name="name" type="text" style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">Email (optional, for follow-up)</label>
  <input name="email" type="email" style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">

  <label class="mono" style="display:block;margin-top:12px">Topic</label>
  <select name="topic" style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1">
    <option>Correction</option>
    <option>Suggestion</option>
    <option>Question</option>
    <option>General feedback</option>
  </select>

  <label class="mono" style="display:block;margin-top:12px">Message</label>
  <textarea name="message" rows="6" style="width:100%;padding:10px;border-radius:8px;background:#0b0e12;border:1px solid rgba(255,255,255,.12);color:#e9edf1"></textarea>

  <!-- Honeypot -->
  <input type="text" name="_gotcha" style="display:none">

  <button class="btn" type="submit" style="margin-top:12px"><span>Send</span></button>
</form>

<p class="muted" style="margin-top:8px">Submitting this form sends your message to the maintainers. For transparency and history, we prefer GitHub Issues when possible.</p>
