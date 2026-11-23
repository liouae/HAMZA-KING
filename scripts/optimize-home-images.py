"""Build responsive editorial images without changing the source photography.

Run from the repository root with Python 3 and Pillow with AVIF support.
Original WebP/PNG files remain available as compatibility fallbacks.
"""

import hashlib
import io
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / "public/home/optimized"
output.mkdir(exist_ok=True)
manifest = {}
names = (
    "hero", "tile-running", "tile-lifestyle", "tile-basketball",
    "tile-outdoor", "story-running", "story-lifestyle", "band-authenticite",
)
for name in names:
    source = root / f"public/home/{name}.webp"
    with Image.open(source) as image:
        variants = []
        for width in (400, 800, 1200):
            width = min(width, image.width)
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            data = io.BytesIO()
            resized.save(data, "AVIF", quality=65, speed=6)
            content = data.getvalue()
            digest = hashlib.sha256(content).hexdigest()[:10]
            filename = f"{name}-{width}-{digest}.avif"
            (output / filename).write_bytes(content)
            variants.append({"url": f"/home/optimized/{filename}", "width": width})
        manifest[f"/home/{name}.webp"] = variants

(root / "app/lib/homeImages.json").write_text(json.dumps(manifest, indent=2) + "\n")

for tone in ("black", "white"):
    with Image.open(root / f"public/brand/hk-lockup-{tone}.png") as image:
        image.thumbnail((480, 480), Image.Resampling.LANCZOS)
        image.save(root / f"public/brand/hk-lockup-{tone}-480.webp", "WEBP", lossless=True)

print(f"Generated {len(manifest)} responsive image sets and two compact logos.")
