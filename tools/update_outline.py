#!/usr/bin/env python3
import os, re, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
OUTLINE = os.path.join(ROOT, "policy", "outline.md")

def main():
    today = datetime.date.today().isoformat()
    updated_line = f"_Last updated: {today}_"
    if not os.path.exists(OUTLINE):
        # create a minimal outline if missing
        content = "# Price Reversion Act — Outline\n\n" + updated_line + "\n"
        os.makedirs(os.path.dirname(OUTLINE), exist_ok=True)
        with open(OUTLINE, "w", encoding="utf-8") as f:
            f.write(content)
        print("Created policy/outline.md with date")
        return

    with open(OUTLINE, "r", encoding="utf-8") as f:
        doc = f.read()

    # Replace an existing date line
    new = re.sub(r"(?m)^_Last updated:\s*\d{4}-\d{2}-\d{2}_\s*$", updated_line, doc)
    if new == doc:
        # If not found, insert after first H1
        m = re.search(r"^#\s+.*$", doc, flags=re.M)
        if m:
            pos = m.end()
            new = doc[:pos] + "\n\n" + updated_line + doc[pos:]
        else:
            new = updated_line + "\n\n" + doc

    if new != doc:
        with open(OUTLINE, "w", encoding="utf-8") as f:
            f.write(new)
        print("Updated policy/outline.md date")
    else:
        print("No changes to policy/outline.md")

if __name__ == "__main__":
    main()
