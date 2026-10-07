"""Copy the StreamSalvage icons into the landing site and add favicon tags to every page.

Run from the repo root:  python brand/add_favicon.py
Safe to re-run: pages that already have rel="icon" are skipped.
"""
import glob
import io
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "brand")
PUBLIC = os.path.join(ROOT, "landing", "public")

COPIES = [
    ("favicon.ico", "favicon.ico"),
    ("logo.svg", "favicon.svg"),
    ("apple-touch-icon.png", "apple-touch-icon.png"),
]

TAGS = (
    '<link rel="icon" href="/favicon.ico" sizes="32x32">\n'
    '    <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n'
    '    <link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
    "    "
)


def main():
    for src, dst in COPIES:
        shutil.copyfile(os.path.join(BRAND, src), os.path.join(PUBLIC, dst))
        print("copied", dst)

    pages = [os.path.join(PUBLIC, "index.html")] + sorted(
        glob.glob(os.path.join(PUBLIC, "guides", "*.html"))
    )
    changed = skipped = 0
    for path in pages:
        with io.open(path, encoding="utf-8", newline="") as f:
            html = f.read()
        if 'rel="icon"' in html:
            skipped += 1
            continue
        if "<title>" not in html:
            print("WARNING: no <title> in", path)
            continue
        with io.open(path, "w", encoding="utf-8", newline="") as f:
            f.write(html.replace("<title>", TAGS + "<title>", 1))
        changed += 1
    print(f"pages updated: {changed}, already had favicon: {skipped}")


if __name__ == "__main__":
    main()
