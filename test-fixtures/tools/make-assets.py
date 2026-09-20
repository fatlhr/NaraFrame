#!/usr/bin/env python3
"""Draws the fixture images.

The reference projects need real PNG files, not placeholders, but a fixture
should not carry megabytes of photography. These are flat editorial shapes:
a few hundred bytes each, and regenerating them is one command, so the
committed files can always be checked against their source.

Usage: python3 test-fixtures/tools/make-assets.py
"""

import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def png(path: Path, width: int, height: int, pixels: bytes) -> None:
    raw = b"".join(
        b"\x00" + pixels[y * width * 3 : (y + 1) * width * 3] for y in range(height)
    )

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def canvas(width: int, height: int, colour: tuple[int, int, int]) -> bytearray:
    return bytearray(bytes(colour) * width * height)


def rect(buf, width, x0, y0, x1, y1, colour):
    for y in range(max(0, y0), y1):
        row = y * width
        for x in range(max(0, x0), x1):
            i = (row + x) * 3
            buf[i : i + 3] = bytes(colour)


def disc(buf, width, height, cx, cy, radius, colour):
    for y in range(max(0, cy - radius), min(height, cy + radius)):
        for x in range(max(0, cx - radius), min(width, cx + radius)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius:
                i = (y * width + x) * 3
                buf[i : i + 3] = bytes(colour)


SEA = (24, 74, 92)
LAND = (232, 224, 210)
INK = (28, 39, 51)
PAPER = (244, 241, 234)
TEAL = (11, 122, 117)
RUST = (255, 90, 54)


def sunda_map() -> None:
    """A schematic strait: two landmasses, a channel, and a marked island."""
    w, h = 1200, 800
    buf = canvas(w, h, SEA)
    # Sumatra to the north-west, Java to the south-east, cut by the strait.
    for step in range(28):
        rect(buf, w, 0, step * 12, 360 + step * 14, step * 12 + 12, LAND)
    for step in range(26):
        rect(buf, w, 700 + step * 8, 430 + step * 14, w, 444 + step * 14, LAND)
    disc(buf, w, h, 612, 402, 26, RUST)
    disc(buf, w, h, 612, 402, 12, LAND)
    png(ROOT / "project-current-issues/assets/sunda-map.png", w, h, bytes(buf))


def archive_plate() -> None:
    """A plate standing in for an archive illustration: banded ash over a ridge."""
    w, h = 900, 1200
    buf = canvas(w, h, (38, 34, 30))
    for band in range(9):
        shade = 60 + band * 14
        rect(buf, w, 0, band * 70, w, band * 70 + 70, (shade, shade - 6, shade - 14))
    for step in range(22):
        rect(buf, w, 300 - step * 14, 640 + step * 26, 600 + step * 14, 666 + step * 26, INK)
    disc(buf, w, h, 450, 640, 60, RUST)
    png(ROOT / "project-current-issues/assets/archive-plate.png", w, h, bytes(buf))


def reef_plate() -> None:
    """The general explainer's photograph stand-in: a water column over a reef."""
    w, h = 1200, 900
    buf = canvas(w, h, PAPER)
    # Water fills the frame, darkening with depth, so the plate works full-bleed.
    for band in range(18):
        depth = 200 - band * 9
        rect(buf, w, 0, band * 50, w, band * 50 + 50, (depth - 46, depth - 12, depth))
    # A reef silhouette along the floor, in the profile's teal.
    for step in range(24):
        top = 720 + (step % 5) * 26
        rect(buf, w, step * 50, top, step * 50 + 50, h, TEAL)
    for step in range(12):
        disc(buf, w, h, 60 + step * 100, 700 + (step % 3) * 30, 26, TEAL)
    png(ROOT / "project-general-explainer/assets/reef-plate.png", w, h, bytes(buf))


def species_plate() -> None:
    """A second plate, so the explainer can compare two images side by side."""
    w, h = 900, 900
    buf = canvas(w, h, (236, 232, 222))
    disc(buf, w, h, 450, 450, 300, (206, 214, 206))
    disc(buf, w, h, 450, 450, 210, TEAL)
    disc(buf, w, h, 380, 380, 60, PAPER)
    png(ROOT / "project-general-explainer/assets/species-plate.png", w, h, bytes(buf))


if __name__ == "__main__":
    sunda_map()
    archive_plate()
    reef_plate()
    species_plate()
    for path in sorted(ROOT.rglob("assets/*.png")):
        print(f"{path.relative_to(ROOT)} {path.stat().st_size} bytes", file=sys.stderr)
