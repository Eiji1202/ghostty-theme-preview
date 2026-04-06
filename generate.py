#!/usr/bin/env python3
"""
Fetch Ghostty themes and generate themes.json.

Themes are distributed as a .tgz archive referenced in Ghostty's build.zig.zon.
This script fetches the latest URL from the repository, downloads the archive,
and parses each theme file into a JSON array.

Usage: python3 generate.py
"""

import io
import json
import re
import tarfile
import urllib.request

BUILD_ZIG_ZON_URL = (
    "https://raw.githubusercontent.com/ghostty-org/ghostty/main/build.zig.zon"
)


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ghostty-theme-preview"})
    with urllib.request.urlopen(req) as res:
        return res.read().decode("utf-8")


def fetch_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ghostty-theme-preview"})
    with urllib.request.urlopen(req) as res:
        return res.read()


def find_themes_url(zon_text):
    """Extract the iterm2_themes / ghostty-themes .tgz URL from build.zig.zon."""
    m = re.search(
        r'\.url\s*=\s*"(https://deps\.files\.ghostty\.org/ghostty-themes[^"]+)"',
        zon_text,
    )
    if not m:
        raise RuntimeError("Could not find themes URL in build.zig.zon")
    return m.group(1)


def parse_theme(content, name):
    data = {"name": name, "bg": "", "fg": "", "colors": [""] * 16}
    for line in content.splitlines():
        line = line.strip()
        m = re.match(r"^background\s*=\s*#?(\S+)", line)
        if m:
            data["bg"] = "#" + m.group(1).lstrip("#")
        m = re.match(r"^foreground\s*=\s*#?(\S+)", line)
        if m:
            data["fg"] = "#" + m.group(1).lstrip("#")
        m = re.match(r"^palette\s*=\s*(\d+)=#?(\S+)", line)
        if m:
            idx = int(m.group(1))
            if idx < 16:
                data["colors"][idx] = "#" + m.group(2).lstrip("#")
    return data if data["bg"] and data["fg"] else None


def main():
    print("Fetching build.zig.zon for themes URL...")
    zon_text = fetch_text(BUILD_ZIG_ZON_URL)
    themes_url = find_themes_url(zon_text)
    print(f"Themes archive: {themes_url}")

    print("Downloading themes archive...")
    tgz_data = fetch_bytes(themes_url)

    themes = []
    with tarfile.open(fileobj=io.BytesIO(tgz_data), mode="r:gz") as tar:
        members = [m for m in tar.getmembers() if m.isfile()]
        total = len(members)
        for i, member in enumerate(members):
            name = member.name.split("/", 1)[-1]  # strip leading "ghostty/"
            if not name:
                continue
            print(f"  [{i + 1}/{total}] {name}")
            try:
                f = tar.extractfile(member)
                if f is None:
                    continue
                content = f.read().decode("utf-8")
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
