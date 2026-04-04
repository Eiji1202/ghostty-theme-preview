#!/usr/bin/env python3
"""
Fetch Ghostty themes from the official repository and generate themes.json
Usage: python3 generate.py
"""

import json
import re
import urllib.request
import urllib.error

GHOSTTY_THEMES_API = "https://api.github.com/repos/ghostty-org/ghostty/contents/assets/themes"
RAW_BASE = "https://raw.githubusercontent.com/ghostty-org/ghostty/main/assets/themes"

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ghostty-theme-preview"})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())

def parse_theme(content, name):
    data = {"name": name, "bg": "", "fg": "", "colors": [""] * 16}
    for line in content.splitlines():
        line = line.strip()
        m = re.match(r'^background\s*=\s*#?(\S+)', line)
        if m:
            data["bg"] = "#" + m.group(1).lstrip("#")
        m = re.match(r'^foreground\s*=\s*#?(\S+)', line)
        if m:
            data["fg"] = "#" + m.group(1).lstrip("#")
        m = re.match(r'^palette\s*=\s*(\d+)=#?(\S+)', line)
        if m:
            idx = int(m.group(1))
            if idx < 16:
                data["colors"][idx] = "#" + m.group(2).lstrip("#")
    return data if data["bg"] and data["fg"] else None

def main():
    print("Fetching theme list from Ghostty repository...")
    files = fetch_json(GHOSTTY_THEMES_API)
    themes = []
    total = len(files)

    for i, f in enumerate(files):
        name = f["name"]
        print(f"  [{i+1}/{total}] {name}")
        try:
            url = f"{RAW_BASE}/{urllib.request.quote(name)}"
            req = urllib.request.Request(url, headers={"User-Agent": "ghostty-theme-preview"})
            with urllib.request.urlopen(req) as res:
                content = res.read().decode("utf-8")
            theme = parse_theme(content, name)
            if theme:
                themes.append(theme)
        except Exception as e:
            print(f"    WARNING: skipped ({e})")

    themes.sort(key=lambda t: t["name"].lower())
    output = "themes.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(themes, f, ensure_ascii=False, indent=2)

    print(f"\n✓ {len(themes)} themes saved to {output}")

if __name__ == "__main__":
    main()
