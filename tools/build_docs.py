#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds/refreshes:
  - policy/README.md  (injects section index between markers)
  - policy/outline.md (injects section summaries between markers)
Also normalizes section files and their front-matter so both
foldered and flat layouts work with pretty permalinks.

Conventions:
  - Sections live under policy/sections/
    Either as:
      A) policy/sections/01_Foo_Bar/README.md
      B) policy/sections/01_Foo_Bar.md
  - Each section should contain a one-line summary comment:
      <!-- SUMMARY: This section covers ... -->
  - Front-matter is required for Jekyll to render pages:
      ---
      layout: default
      title: 01 — Foo Bar
      permalink: /policy/sections/01_Foo_Bar/
      ---

Markers:
  policy/README.md:
    <!-- BEGIN:SECTION_INDEX -->
    ... (generated) ...
    <!-- END:SECTION_INDEX -->

  policy/outline.md:
    <!-- BEGIN:SECTION_OUTLINE -->
    ... (generated) ...
    <!-- END:SECTION_OUTLINE -->
"""

import os
import re
import io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLICY_DIR = os.path.join(ROOT, "policy")
SECTIONS_DIR = os.path.join(POLICY_DIR, "sections")

README_PATH = os.path.join(POLICY_DIR, "README.md")
OUTLINE_PATH = os.path.join(POLICY_DIR, "outline.md")

IDX_BEGIN = r"<!--\s*BEGIN:SECTION_INDEX\s*-->"
IDX_END   = r"<!--\s*END:SECTION_INDEX\s*-->"
OUT_BEGIN = r"<!--\s*BEGIN:SECTION_OUTLINE\s*-->"
OUT_END   = r"<!--\s*END:SECTION_OUTLINE\s*-->"

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)  # front-matter matcher
H1_RE = re.compile(r"^\s*#\s+(.+?)\s*$", re.M)
SUMMARY_RE = re.compile(r"<!--\s*SUMMARY:\s*(.*?)\s*-->", re.S)

def read_text(path: str) -> str:
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_text(path: str, text: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

def list_sections():
    """
    Return a list of dicts with:
      name: '01_Foundations_of_Ownership'
      md_path: absolute path to MD file (either .../name/README.md or .../name.md)
      url: pretty permalink '/policy/sections/name/'
    """
    items = []
    if not os.path.isdir(SECTIONS_DIR):
        return items

    entries = sorted(os.listdir(SECTIONS_DIR))
    for entry in entries:
        full = os.path.join(SECTIONS_DIR, entry)
        if os.path.isdir(full):
            md = os.path.join(full, "README.md")
            if os.path.isfile(md):
                items.append({
                    "name": entry,
                    "md_path": md,
                    "url": f"/policy/sections/{entry}/",
                    "flat": False,
                })
        elif entry.lower().endswith(".md"):
            name = entry[:-3]  # strip .md
            items.append({
                "name": name,
                "md_path": full,
                "url": f"/policy/sections/{name}/",
                "flat": True,
            })
    # Sort by numeric prefix if present
    def sort_key(d):
        m = re.match(r"^(\d+)", d["name"])
        return int(m.group(1)) if m else 9999
    items.sort(key=sort_key)
    return items

def ensure_front_matter(md_path: str, title: str, permalink: str):
    """
    Ensure the MD file has front-matter with layout/title/permalink.
    If front-matter exists, we patch missing keys.
    """
    text = read_text(md_path)
    fm = {}
    body = text
    m = FM_RE.match(text)
    if m:
        # parse existing fm
        raw = m.group(1)
        body = text[m.end():]
        for line in raw.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip().strip("'\"")
    # enforce fields
    changed = False
    if fm.get("layout") != "default":
        fm["layout"] = "default"; changed = True
    if fm.get("title") != title:
        fm["title"] = title; changed = True
    if fm.get("permalink") != permalink:
        fm["permalink"] = permalink; changed = True

    if changed or not m:
        # rebuild front-matter block
        lines = ["---"]
        for k in ("layout", "title", "permalink"):
            lines.append(f"{k}: {fm[k]}")
        lines.append("---")
        new_text = "\n".join(lines) + "\n" + body.lstrip("\n")
        write_text(md_path, new_text)

def extract_title(md_path: str, default_title: str) -> str:
    text = read_text(md_path)
    # Prefer front-matter title if present
    m = FM_RE.match(text)
    if m:
        raw = m.group(1)
        for line in raw.splitlines():
            if line.strip().startswith("title:"):
                return line.split(":",1)[1].strip().strip("'\"")
    # fallback to first H1
    m = H1_RE.search(text)
    if m:
        return m.group(1).strip()
    return default_title

def extract_summary(md_path: str) -> str:
    text = read_text(md_path)
    m = SUMMARY_RE.search(text)
    return m.group(1).strip() if m else "(Summary not provided)"

def patch_between_markers(path: str, begin_pat: str, end_pat: str, new_block: str):
    text = read_text(path)
    begin = re.search(begin_pat, text)
    end = re.search(end_pat, text)
    if not begin or not end:
        # If markers missing, append them at end
        block = f"\n{begin_pat}\n{new_block}\n{end_pat}\n"
        write_text(path, text.rstrip() + block)
        return
    start = begin.end()
    stop = end.start()
    updated = text[:start] + "\n" + new_block.strip() + "\n" + text[stop:]
    if updated != text:
        write_text(path, updated)

def main():
    sections = list_sections()
    if not sections:
        print("No sections found under policy/sections/")
        return

    # Normalize front-matter and build lists
    idx_lines = []
    out_lines = []
    for s in sections:
        name = s["name"]
        md_path = s["md_path"]
        url = s["url"]

        # Derive a friendly title from the filename if needed
        # e.g., '01_Foundations_of_Ownership' -> '01 — Foundations of Ownership'
        m = re.match(r"^(\d+)[ _-]+(.+)$", name)
        if m:
            num = m.group(1)
            label = m.group(2).replace("_", " ").replace("-", " ")
            title_guess = f"{num} — {label}"
        else:
            title_guess = name.replace("_", " ").replace("-", " ")

        # Ensure front-matter so flat files render at pretty URLs
        ensure_front_matter(md_path, title_guess, url)

        # Extract title & summary for index/outline
        title = extract_title(md_path, title_guess)
        summary = extract_summary(md_path)

        # Build index item (short)
        idx_lines.append(f"- **[{title}]({{{{ '{url}' | relative_url }}}})** — {summary}".format(url=url))

        # Build outline item (longer format if you want)
        out_lines.append(f"### [{title}]({{{{ '{url}' | relative_url }}}})\n\n{summary}\n")

    # Inject into policy/README.md
    idx_md = "\n".join(idx_lines)
    patch_between_markers(README_PATH, IDX_BEGIN, IDX_END, idx_md)

    # Inject into policy/outline.md
    out_md = "\n\n".join(out_lines)
    patch_between_markers(OUTLINE_PATH, OUT_BEGIN, OUT_END, out_md)

    print(f"Updated index with {len(sections)} sections.")
    print("Done.")

if __name__ == "__main__":
    main()
