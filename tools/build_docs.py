#!/usr/bin/env python3
import os, re, sys, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
BILL_PATH    = os.path.join(ROOT, "policy", "bill-text.md")
README_PATH  = os.path.join(ROOT, "policy", "README.md")
OUTLINE_PATH = os.path.join(ROOT, "policy", "outline.md")
SHORT_SHA    = os.getenv("GITHUB_SHA", "")[:7]
#Change ACT_NAME if we decide on another name - It will change accordingly
ACT_NAME = os.getenv("ACT_NAME", "Afford Act")
OUTLINE_TITLE = f"{ACT_NAME} — Outline"
BILL_TITLE = f"{ACT_NAME} — Compiled Master"
POLICY_HUB_TITLE = "Policy"

# ----------------------------- helpers -----------------------------

def sort_key(name):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def clean_name(name):
    return re.sub(r"_+", " ", name).strip()

# MD cleanup
H2_RE      = re.compile(r"(?m)^\s*##\s+(.+?)\s*$")
MD_LINK    = re.compile(r"\[([^\]]+)\]\([^)]+\)")
MD_CODE    = re.compile(r"`+([^`]+)`+")
MD_IMAGE   = re.compile(r"!\[[^\]]*\]\([^)]+\)")

# Overrides
SUM_LINE   = re.compile(r"<!--\s*SUMMARY\s*:\s*(.*?)\s*-->", re.IGNORECASE)
SUM_BLOCK  = re.compile(r"<!--\s*SUMMARY\s*(?:\r?\n)(.*?)(?:\r?\n)\s*-->", re.IGNORECASE | re.DOTALL)
KEY_LINE   = re.compile(r"<!--\s*KEYWORDS\s*:\s*(.*?)\s*-->", re.IGNORECASE)

# Visibility flags (verbose + legacy)
FLAG_LISTS_HIDE   = re.compile(r"<!--\s*(?:LISTS:\s*hide|HIDE_FROM_LISTS)\s*-->", re.IGNORECASE)
FLAG_OUTLINE_HIDE = re.compile(r"<!--\s*(?:OUTLINE:\s*hide|HIDE_FROM_OUTLINE)\s*-->", re.IGNORECASE)
FLAG_README_HIDE  = re.compile(r"<!--\s*(?:README:\s*hide|HIDE_FROM_README)\s*-->", re.IGNORECASE)

KEYWORD_ALLOWLIST = {
    "enforcement","definitions","valuation","formulas","caps","ceiling","floor",
    "audits","appeals","vacancy","blight","trusts","heirs","priority",
    "multi-unit","rent","tolerance","vehicles","insurance","fees",
    "wage index","minimum wage","tips","service charges","doc fee","exemptions",
    "grants","pass-through","hoa","timeshare","boarding","student housing"
}

def clean_md_text(s):
    s = MD_IMAGE.sub("", s)
    s = MD_LINK.sub(r"\1", s)
    s = MD_CODE.sub(r"\1", s)
    return " ".join(s.split())

def parse_keywords(raw):
    out = []
    for token in re.split(r"[,\s]+", raw.strip().lower()):
        token = token.strip()
        if token and token not in out:
            out.append(token)
    return out[:8]

def auto_keywords(text):
    kws = []
    for h in [clean_md_text(m.group(1)).lower() for m in H2_RE.finditer(text)]:
        for token in re.split(r"[^\w\- ]+", h):
            token = token.strip()
            if token and (token in KEYWORD_ALLOWLIST) and token not in kws:
                kws.append(token)
            if len(kws) >= 6:
                break
        if len(kws) >= 6:
            break
    return kws

# ------------------------- section discovery -------------------------

def list_sections():
    """Return list of dicts with metadata & flags for each section folder."""
    items, dbg = [], {"dir": SECTIONS_DIR, "folders": []}
    if not os.path.isdir(SECTIONS_DIR):
        return [], dbg

    for d in os.listdir(SECTIONS_DIR):
        p = os.path.join(SECTIONS_DIR, d)
        if not os.path.isdir(p):
            continue
        md = os.path.join(p, "README.md")
        md_exists = os.path.isfile(md)
        title = None
        text = ""
        if md_exists:
            with open(md, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
                # first H1 as title
                for line in text.splitlines():
                    if line.lstrip().startswith("#"):
                        title = re.sub(r"^#+\s*", "", line).strip()
                        break
        if not title:
            title = clean_name(d)

        # numbering & link
        m = re.match(r"^(\d+)", d)
        num = f"{int(m.group(1)):02d}" if m else "—"
        rel = f"sections/{d}/README.md"

        # visibility flags
        hide_lists   = bool(FLAG_LISTS_HIDE.search(text))
        hide_outline = hide_lists or bool(FLAG_OUTLINE_HIDE.search(text))
        hide_readme  = hide_lists or bool(FLAG_README_HIDE.search(text))

        items.append({
            "num": num, "title": title, "rel": rel, "md_exists": md_exists,
            "folder": d, "text": text,
            "hide_outline": hide_outline, "hide_readme": hide_readme
        })
        dbg["folders"].append({
            "folder": d, "num": num, "title": title, "md_exists": md_exists,
            "hide_outline": hide_outline, "hide_readme": hide_readme
        })

    items.sort(key=lambda t: (9999 if t["num"]=="—" else int(t["num"]), t["title"].lower()))
    return items, dbg

# ------------------------------ outputs ------------------------------

def compile_bill(items):
    parts = []
    parts.append(f"# {BILL_TITLE}\n")
    parts.append("_Generated (UTC): " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC") + "_\n\n")
    for it in items:
        if it["md_exists"]:
            md_path = os.path.join(SECTIONS_DIR, it["folder"], "README.md")
            with open(md_path, "r", encoding="utf-8", errors="replace") as f:
                parts.append(f.read().rstrip() + "\n")
                parts.append("\n---\n\n")
    text = "".join(parts).rstrip() + "\n"
    os.makedirs(os.path.dirname(BILL_PATH), exist_ok=True)
    with open(BILL_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", BILL_PATH)

def sections_block(items):
    if not items:
        return "_No sections discovered under `policy/sections/`._\n"
    return "\n".join([f"- {it['num']} — [{it['title']}]({it['rel']})" for it in items]) + "\n"

def render_readme(items):
    visible = [it for it in items if not it["hide_readme"]]
    header = (
        f"# {POLICY_HUB_TITLE}\n\n"
        f"**Start here → [Master Bill (compiled)](./bill-text.md)** • "
        f"[Outline](./outline.md)\n\n"
        "## Sections\n\n"
        "<!-- BEGIN:SECTION_INDEX -->\n"
    )
    body = sections_block(visible) + "<!-- END:SECTION_INDEX -->\n"
    text = header + body
    os.makedirs(os.path.dirname(README_PATH), exist_ok=True)
    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", README_PATH)

def extract_summary_and_keywords(text):
    # SUMMARY override
    m = SUM_BLOCK.search(text)
    if m:
        summary = clean_md_text(m.group(1).strip())
    else:
        m = SUM_LINE.search(text)
        summary = clean_md_text(m.group(1)) if m else ""

    # Fallback to first paragraph after H1
    if not summary:
        lines = text.splitlines()
        i = 0
        while i < len(lines) and not lines[i].lstrip().startswith("#"):
            i += 1
        while i < len(lines) and lines[i].lstrip().startswith("#"):
            i += 1
        while i < len(lines) and lines[i].strip() == "":
            i += 1
        para = []
        while i < len(lines):
            if lines[i].strip() == "" or lines[i].lstrip().startswith("#"):
                break
            if not lines[i].lstrip().startswith((">", "-", "*")):
                para.append(lines[i].rstrip())
            i += 1
        summary = clean_md_text(" ".join(para))
    if len(summary) > 360:
        summary = summary[:357].rstrip() + "..."

    # KEYWORDS override or auto
    m = KEY_LINE.search(text)
    if m:
        kws = parse_keywords(m.group(1))
    else:
        kws = auto_keywords(text)
    return summary, kws

def render_outline(items):
    visible = [it for it in items if not it["hide_outline"]]
    stamp = "_Last updated: " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    if SHORT_SHA: stamp += f" · commit {SHORT_SHA}_"
    else: stamp += "_"

    parts = []
    parts.append(f"# {OUTLINE_TITLE}\n\n")
    parts.append(stamp + "\n\n")
    parts.append("This outline summarizes each section at a glance. Click through for full text.\n\n")

    for it in visible:
        parts.append(f"## {it['num']} — {it['title']}\n\n")
        parts.append(f"[Open section]({it['rel']})\n\n")
        summary, kws = extract_summary_and_keywords(it["text"])
        if summary:
            parts.append(summary + "\n\n")
        if kws:
            parts.append("_Keywords:_ " + ", ".join(kws) + "\n\n")

    text = "".join(parts).rstrip() + "\n"
    os.makedirs(os.path.dirname(OUTLINE_PATH), exist_ok=True)
    with open(OUTLINE_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", OUTLINE_PATH)

# ------------------------------- main -------------------------------

def main():
    items, dbg = list_sections()
    print("[build_docs] discovered sections:", json.dumps(dbg, indent=2))
    compile_bill(items)
    render_readme(items)
    render_outline(items)
    with open(OUTLINE_PATH, "r", encoding="utf-8") as f:
        head = "".join(f.readlines()[:60])
    print("----- outline preview -----\n" + head)

if __name__ == "__main__":
    sys.exit(main())
