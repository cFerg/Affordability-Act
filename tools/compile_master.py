#!/usr/bin/env python3
import os

root = os.path.dirname(os.path.dirname(__file__))
order = os.path.join(root, "tools", "sections_order.txt")
outf = os.path.join(root, "draft", "bill-text.md")

with open(order) as f:
    files = [line.strip() for line in f if line.strip()]

parts = []
for rel in files:
    p = os.path.join(root, rel)
    with open(p, 'r') as fh:
        parts.append(fh.read().strip())

doc = "\n\n---\n\n".join(parts) + "\n"
os.makedirs(os.path.dirname(outf), exist_ok=True)
with open(outf, "w") as f:
    f.write(doc)

print("Wrote", outf)
