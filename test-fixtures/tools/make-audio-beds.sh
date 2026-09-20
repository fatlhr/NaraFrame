#!/usr/bin/env bash
# Builds the fixture's music bed and effect.
#
# These are synthesised, not licensed music: a fixture should prove the mix
# (ducking, fades, placement) without carrying someone's track. Regenerate
# with: bash test-fixtures/tools/make-audio-beds.sh
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/project-current-issues/audio/music"
mkdir -p "$out"

# A slow three-note drone, loud enough to sit ~12 dB under speech at 0.6.
ffmpeg -v error -y \
  -f lavfi -i "sine=f=147:d=30" \
  -f lavfi -i "sine=f=196:d=30" \
  -f lavfi -i "sine=f=294:d=30" \
  -filter_complex "amix=inputs=3:normalize=0,tremolo=f=0.25:d=0.25,volume=3.2,alimiter=limit=0.9" \
  -ac 1 -ar 44100 -b:a 96k "$out/bed.mp3"

# A short mark for the moment the mechanism lands.
ffmpeg -v error -y -f lavfi -i "sine=f=660:d=0.5" \
  -af "afade=t=out:st=0.06:d=0.44,volume=0.9" \
  -ac 1 -ar 44100 -b:a 96k "$out/mark.mp3"

for file in "$out/bed.mp3" "$out/mark.mp3"; do
  printf '%s %s\n' "$(shasum -a 256 "$file" | cut -d' ' -f1)" "${file#"$root/"}"
done
