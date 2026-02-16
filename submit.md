---
layout: default
title: Submit Feedback
---

<div class="cover">
  <h1>Submit feedback</h1>
</div>

<form method="POST" action="https://feedback.affordact.com/api/submit">
  <label>Topic</label>
  <input name="topic" required />

  <label>Section (optional)</label>
  <input name="section" />

  <label>Name (optional)</label>
  <input name="name" />

  <label>Email</label>
  <input name="email" type="email" required />

  <label>Message</label>
  <textarea name="message" required rows="8"></textarea>

  <label>
    <input type="checkbox" name="wantsUpdates" value="yes" />
    I want a reply by email
  </label>

  <button class="btn" type="submit"><span>Send feedback</span></button>
</form>