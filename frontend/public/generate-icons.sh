#!/bin/sh
# Generate the YoTop10 favicon set — requires ImageMagick
# Run: brew install imagemagick && sh public/generate-icons.sh
#
# Source of truth: the 5-bar brand mark. Geometry lives on a 40x40 grid
# (frontend/src/components/Logo.tsx) and scales x12.8 onto the 512px canvas:
# the top 2 bars are short, the bottom 3 are wide, all bars are right-aligned,
# fill #d24924 (sampled from the shipped icon-512.png).
set -e

BAR_FILL='#d24924'

# 512px-space rounded bars: "roundrectangle x1,y1 x2,y2 r,r"
convert -size 512x512 xc:none -fill "$BAR_FILL" \
  -draw 'roundrectangle 192,23 391,99 17,17' \
  -draw 'roundrectangle 192,114 391,191 17,17' \
  -draw 'roundrectangle 109,205 390,290 19,19' \
  -draw 'roundrectangle 109,302 390,389 19,19' \
  -draw 'roundrectangle 109,403 390,494 20,20' \
  public/icon-512.png

# Derive the rest of the set from the 512 master
convert public/icon-512.png -resize 192x192 public/icon-192.png
convert public/icon-512.png -resize 32x32 public/favicon-32x32.png
convert public/favicon-32x32.png -resize 16x16 public/favicon-16x16.png
convert public/icon-512.png -resize 180x180 public/apple-touch-icon.png
convert public/icon-512.png -resize 150x150 public/mstile-150x150.png
convert public/icon-512.png -define icon:auto-resize=16,32,48,64 public/favicon.ico
