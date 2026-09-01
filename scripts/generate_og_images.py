"""Generates one Open Graph preview image per article into public/og/<slug>.jpg.

Every article shared the site's single og-image.png, so a run of posts all
looked identical in a feed. These carry the article's own title, which is the
part that makes someone stop scrolling.

Written as baseline JPEG rather than PNG: Facebook rejected the PNGs as
"Corrupted Image" even though they were structurally valid, served with the
right content type, and byte-identical between disk and CDN. JPEG is the
format its image pipeline handles most reliably, and the changed extension
also gives every card a URL the crawler has no cached verdict for.

One-off local tool, not part of the build: run it after adding an article, or
leave it - `_redirects` falls back to the generic image for any slug without a
file here, so a missing image degrades rather than breaks.

    python scripts/generate_og_images.py

Reads the live article list, so titles always match what's published.
"""

import json
import pathlib
import urllib.request

from PIL import Image, ImageDraw, ImageFont

API = 'https://api.skieta.com/api/content/articles/'
OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'og'

WIDTH, HEIGHT = 1200, 630
MARGIN = 84

# Matches the app's dark surface and its emerald accent (see index.css).
BG = (13, 21, 18)
CARD = (22, 33, 29)
ACCENT = (5, 150, 105)
ACCENT_LIGHT = (52, 211, 153)
TEXT = (233, 240, 235)
MUTED = (124, 141, 132)

FONT_DIR = pathlib.Path('C:/Windows/Fonts')


def load_font(names, size):
    for name in names:
        path = FONT_DIR / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def wrap(draw, text, font, max_width):
    lines, current = [], ''
    for word in text.split():
        candidate = f'{current} {word}'.strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render(title: str, path: pathlib.Path) -> None:
    image = Image.new('RGB', (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)

    # Inset panel, so the image reads as a card rather than a flat colour block
    # once a feed scales it down to a thumbnail.
    draw.rounded_rectangle([28, 28, WIDTH - 28, HEIGHT - 28], radius=28, fill=CARD)
    draw.rectangle([28, 28, 40, HEIGHT - 28], fill=ACCENT)

    max_width = WIDTH - 2 * MARGIN

    # Longer titles step down through sizes until they fit in four lines, so a
    # short headline stays large and a long one stays inside the card.
    for size in (68, 60, 54, 48, 42):
        font = load_font(['arialbd.ttf', 'Arial_Bold.ttf', 'arial.ttf'], size)
        lines = wrap(draw, title, font, max_width)
        if len(lines) <= 4:
            break

    line_height = int(size * 1.24)
    block_height = line_height * len(lines)
    y = (HEIGHT - block_height) // 2 - 24
    for line in lines:
        draw.text((MARGIN, y), line, font=font, fill=TEXT)
        y += line_height

    wordmark = load_font(['arialbd.ttf', 'arial.ttf'], 34)
    draw.text((MARGIN, HEIGHT - MARGIN - 24), 'skieta', font=wordmark, fill=ACCENT_LIGHT)

    tagline_font = load_font(['arial.ttf'], 26)
    tagline = 'finanse osobiste bez arkusza kalkulacyjnego'
    draw.text(
        (MARGIN + draw.textlength('skieta', font=wordmark) + 20, HEIGHT - MARGIN - 20),
        tagline,
        font=tagline_font,
        fill=MUTED,
    )

    # Baseline (not progressive) and no subsampling: the widest-compatibility
    # settings, since the point of moving off PNG was to stop tripping over
    # decoder quirks.
    image.save(path, 'JPEG', quality=90, optimize=True, progressive=False, subsampling=0)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(API, timeout=30) as response:
        articles = json.load(response)

    for old_png in OUT_DIR.glob('*.png'):
        old_png.unlink()

    for article in articles:
        path = OUT_DIR / f"{article['slug']}.jpg"
        render(article['title'], path)
        print(f"{path.name}  ({path.stat().st_size // 1024} KB)")

    print(f'\n{len(articles)} grafik w {OUT_DIR}')


if __name__ == '__main__':
    main()
