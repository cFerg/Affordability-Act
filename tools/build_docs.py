#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds/refreshes:
  - policy/README.md      (injects section index between markers)
  - policy/outline.md     (injects section summaries between markers)
  - policy/bill-text.md   (compiles full bill between markers)

Works with either section layout:
  A) policy/sections/01_Foo/README.md
  B) policy/sections/01_Foo.md

Markers expected (literal strings; now matched case-insensitively & space-tolerant):
  policy/README.md:
    <!-- BEGIN:SECTION_INDEX -->
    ... (generated) ...
    <!-- END:SECTION_INDEX -->

  policy/outline.md:
    <!-- BEGIN:SECTION_OUTLINE -->
    ... (generated) ...
    <!-- END:SECTION_OUTLINE -->

  policy/bill-text.md:
    <!-- BEGIN:BILL_BODY -->
    ... (generated) ...
    <!-- END:BILL_BODY -->
"""

import os
import re
import io
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLICY_DIR = os.path.join(ROOT, "policy")
SECTIONS_DIR = os.path.join(POLICY_DIR, "sections")
README_PATH = os.path.join(POLICY_DIR, "README.md")
OUTLINE_PATH = os.path.join(POLICY_DIR, "outline.md")
BILL_PATH = os.path.join(POLICY_DIR, "bill-text.md")

# Literal markers (we'll build relaxed regex when replacing)
IDX_BEGIN = "<!-- BEGIN:SECTION_INDEX -->"
IDX_END   = "<!-- END:SECTION_INDEX -->"
OUT_BEGIN = "<!-- BEGIN:SECTION_OUTLINE -->"
OUT_END   = "<!-- END:SECTION_OUTLINE -->"
BILL_BEGIN = "<!-- BEGIN:BILL_BODY -->"
BILL_END   = "<!-- END:BILL_BODY -->"

# Regex helpers
FM_RE = re.compile(r"^---\s*\r?\n(.*?)\r?\n---\s*\r?\n", re.S)       # YAML front matter
H1_RE = re.compile(r"^\s*#\s+(.+?)\s*$", re.M)                       # first H1
H2_RE = re.compile(r"^\s*##\s+(.+?)\s*$", re.M)                      # H2
H3_RE = re.compile(r"^\s*###\s+(.+?)\s*$", re.M)                     # H3
SUMMARY_RE = re.compile(r"<!--\s*SUMMARY:\s*(.*?)\s*-->", re.S)

def read_text(path: str) -> str:
  with io.open(path, "r", encoding="utf-8") as f:
    return f.read()

def write_text(path: str, text: str):
  os.makedirs(os.path.dirname(path), exist_ok=True)
  with io.open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(text)

def file_exists(path: str) -> bool:
  try:
    return os.path.isfile(path)
  except Exception:
    return False

def list_sections():
  items = []
  if not os.path.isdir(SECTIONS_DIR):
    return items

  for entry in sorted(os.listdir(SECTIONS_DIR)):
    full = os.path.join(SECTIONS_DIR, entry)
    if os.path.isdir(full):
      md = os.path.join(full, "README.md")
      if file_exists(md):
        items.append({
          "name": entry,
          "md_path": md,
          "url": f"/policy/sections/{entry}/",
          "flat": False,
        })
    elif entry.lower().endswith(".md"):
      name = entry[:-3]
      items.append({
        "name": name,
        "md_path": full,
        "url": f"/policy/sections/{name}/",
        "flat": True,
      })

  def sort_key(d):
    m = re.match(r"^(\d+)", d["name"])
    return int(m.group(1)) if m else 9999
  items.sort(key=sort_key)
  return items

def ensure_front_matter(md_path: str, title: str, permalink: str):
  """
  Ensure MD has front-matter with layout/title/permalink.
  Ensure TWO newlines after closing --- so it never bleeds into content.
  """
  text = read_text(md_path)
  fm = {}
  body = text
  m = FM_RE.match(text)
  if m:
    raw = m.group(1)
    body = text[m.end():]
    for line in raw.splitlines():
      if ":" in line:
        k, v = line.split(":", 1)
        fm[k.strip()] = v.strip().strip("'\"")
  changed = False
  if fm.get("layout") != "default":
    fm["layout"] = "default"; changed = True
  if fm.get("title") != title:
    fm["title"] = title; changed = True
  if fm.get("permalink") != permalink:
    fm["permalink"] = permalink; changed = True

  if changed or not m:
    lines = ["---"]
    for k in ("layout", "title", "permalink"):
      lines.append(f"{k}: {fm[k]}")
    lines.append("---")
    new_text = "\n".join(lines) + "\n\n" + body.lstrip("\n")
    write_text(md_path, new_text)

def strip_front_matter(text: str) -> str:
  m = FM_RE.match(text)
  if m: return text[m.end():]
  if text.lstrip().startswith('---'):
    parts = text.split('---')
    if len(parts) >= 3:
      return '---'.join(parts[2:]).lstrip('\r\n')
  return text

def extract_title_from_filename(name: str) -> str:
  m = re.match(r"^(\d+)[ _-]+(.+)$", name)
  if m:
    num = m.group(1)
    label = m.group(2).replace("_", " ").replace("-", " ")
    return f"{num} — {label}"
  return name.replace("_", " ").replace("-", " ")

def extract_title_from_md(md_text: str, fallback: str) -> str:
  m = FM_RE.match(md_text)
  if m:
    raw = m.group(1)
    for line in raw.splitlines():
      if line.strip().startswith("title:"):
        return line.split(":", 1)[1].strip().strip("'\"")
  m = H1_RE.search(md_text)
  if m: return m.group(1).strip()
  return fallback

def extract_summary(md_text: str) -> str:
  m = SUMMARY_RE.search(md_text)
  return m.group(1).strip() if m else "(Summary not provided)"

def slugify(s: str) -> str:
  s = s.strip().lower()
  s = re.sub(r"[^\w\s-]", "", s)
  s = re.sub(r"\s+", "-", s)
  s = re.sub(r"-+", "-", s)
  return s

def split_subsections(md_text: str):
  """
  Returns list of {level, heading, id, content} for H2/H3.
  """
  body = strip_front_matter(md_text)
  marks = []
  for m in H2_RE.finditer(body): marks.append((m.start(), 2, m.group(1).strip()))
  for m in H3_RE.finditer(body): marks.append((m.start(), 3, m.group(1).strip()))
  marks.sort(key=lambda x: x[0])
  out = []
  for i, (pos, lvl, title) in enumerate(marks):
    end = marks[i+1][0] if i+1 < len(marks) else len(body)
    segment = body[pos:end]
    content = segment.split("\n", 1)[1] if "\n" in segment else ""
    out.append({"level": lvl, "heading": title, "id": slugify(title), "content": content.strip()})
  return out

def patch_between_markers(path: str, begin_pat: str, end_pat: str, new_block: str):
  """Replace text between markers. Tolerates spaces after ':' and case-insensitive."""
  if not file_exists(path):
    write_text(path, f"{begin_pat}\n{new_block.strip()}\n{end_pat}\n")
    return
  text = read_text(path)

  def relaxed_marker_regex(marker: str) -> str:
    escaped = re.escape(marker).replace(r"\:", r"\:\s*")
    return escaped.replace("BEGIN", "[Bb][Ee][Gg][Ii][Nn]").replace("END", "[Ee][Nn][Dd]")

  pattern = relaxed_marker_regex(begin_pat) + r"[\s\S]*?" + relaxed_marker_regex(end_pat)
  text = re.sub(
    pattern,
    lambda _: f"{begin_pat}\n{new_block.strip()}\n{end_pat}",
    text,
    flags=re.MULTILINE,
  )
  write_text(path, text)

def ensure_anchors(md_body: str, section_index: int) -> str:
  sid = f"section-{section_index}"
  md_body = re.sub(r"\{#section-\d+\}", "", md_body)  # remove printed ids if any
  anchor = f'<a id="{sid}"></a>\n'
  m = H1_RE.search(md_body)
  if m:
    h1_line = m.group(0)
    return md_body.replace(h1_line, anchor + h1_line, 1)
  return f'{anchor}# Section {section_index}\n\n' + md_body.lstrip()

def main():
  sections = list_sections()
  if not sections:
    print("No sections found under policy/sections/")
    return

  index_lines, outline_lines, bill_lines = [], [], []

  for idx, s in enumerate(sections, start=1):
    name = s["name"]; md_path = s["md_path"]; url = s["url"]
    title_guess = extract_title_from_filename(name)
    ensure_front_matter(md_path, title_guess, url)

    raw = read_text(md_path)
    title = extract_title_from_md(raw, title_guess)
    summary = extract_summary(raw)

    index_lines.append(f"- **[{title}]({url})** — {summary}")
    outline_lines.append(f"### [{title}]({url})\n\n{summary}\n")

    # section content for bill
    body = strip_front_matter(raw)
    body = re.sub(r'<!--\s*SUMMARY:.*?-->\s*', '', body, flags=re.S)  # remove summary comments
    body = re.sub(r"^---[\s\S]*?---\s*\r?\n", "", body, flags=re.M)   # guard: strip fm if any remains
    body = ensure_anchors(body, idx)
    if idx > 1: bill_lines.append("\n---\n")
    bill_lines.append(body.rstrip() + "\n")

  # write index, outline
  patch_between_markers(README_PATH, IDX_BEGIN, IDX_END, "\n".join(index_lines))
  patch_between_markers(OUTLINE_PATH, OUT_BEGIN, OUT_END, "\n\n".join(outline_lines))

  # compile bill
  bill_block = "\n".join(bill_lines).strip() + "\n"
  patch_between_markers(BILL_PATH, BILL_BEGIN, BILL_END, bill_block)

  # build search index (sections + subsections) and ordered list for cross-nav
  search_items, sections_index = [], []
  for idx, s in enumerate(sections, start=1):
    name = s["name"]; url = s["url"]
    raw = read_text(s["md_path"])
    title = extract_title_from_md(raw, extract_title_from_filename(name))
    summary = extract_summary(raw)

    search_items.append({"title": title, "url": url, "section": idx, "summary": summary})
    sections_index.append({"n": idx, "title": title, "url": url})

    for sub in split_subsections(raw):
      text = re.sub(r"`[^`]+`", "", sub["content"])
      text = re.sub(r"\s+", " ", text).strip()
      excerpt = (text[:220] + "…") if len(text) > 220 else text
      search_items.append({
        "title": f"{title} — {sub['heading']}",
        "url": f"{url}#{sub['id']}",
        "section": idx,
        "heading": sub["heading"],
        "anchor": sub["id"],
        "summary": excerpt
      })

  write_text(os.path.join(ROOT, "search.json"), json.dumps(search_items, ensure_ascii=False, indent=2))
  write_text(os.path.join(ROOT, "sections.json"), json.dumps(sections_index, ensure_ascii=False, indent=2))

  print(f"Updated index ({len(sections)}), outline, compiled bill, search & sections JSON.")

if __name__ == "__main__":
  main()