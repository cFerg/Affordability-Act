#!/usr/bin/env python3
import os, re, sys, datetime, traceback

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
DEST = os.path.join(ROOT, "policy", "bill-text.md")

def sort_key(folder: str):
    m = re.match(r"^(\d+)", folder)
    return (int(m.group(1)) if m else 9999, folder.lower())

def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().rstrip() + "\n"

def build() -> str:
    parts = []
    hdr = [
        "# Price Reversion Act — Compiled Master\n",
        f"_Generated: {datetime.date.today().isoformat()}_\n",
        "\n"
    ]
    parts.extend(hdr)

    if not os.path.isdir(SECTIONS_DIR):
        parts.append("> _No sections directory found at `policy/sections/`._\n")
        return "".join(parts)

    folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
    folders.sort(key=sort_key)

    seen = []
    for d in folders:
        md = os.path.join(SECTIONS_DIR, d, "README.md")
        if not os.path.isfile(md):
            # Skip silently but log later
            seen.append((d, False))
            continue
        try:
            txt = read_file(md)
            parts.append(txt)
            parts.append("\n---\n\n")
            seen.append((d, True))
        except Exception:
            # Keep compiling even if a single file has encoding/errors
            parts.append(f"\n> _Skipped unreadable section `{d}`_\n\n---\n\n")
            seen.append((d, False))

    # trailing trim
    doc = "".join(parts).rstrip() + "\n"

    # Debug to stdout (visible in Actions)
    ok = [d for d, good in seen if good]
    bad = [d for d, good in seen if not good]
    print(f"[compile] sections included: {len(ok)} -> {ok}")
    if bad:
        print(f"[compile] sections skipped: {len(bad)} -> {bad}")

    return doc

def main():
    try:
        os.makedirs(os.path.dirname(DEST), exist_ok=True)
        doc = build()
        with open(DEST, "w", encoding="utf-8") as f:
            f.write(doc)
        print(f"[compile] wrote {DEST}")
        return 0
    except Exception as e:
        # Don’t crash the job: write a minimal file and exit 0
        os.makedirs(os.path.dirname(DEST), exist_ok=True)
        fallback = "# Price Reversion Act — Compiled Master\n\n> _Compilation error; see workflow logs._\n"
        with open(DEST, "w", encoding="utf-8") as f:
            f.write(fallback)
        print("[compile] ERROR:", e)
        traceback.print_exc()
        return 0

if __name__ == "__main__":
    sys.exit(main())
