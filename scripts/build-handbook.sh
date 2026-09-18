#!/bin/sh
# build-handbook.sh — YoTop10 handbook to PDF + EPUB (via pandoc)
set -e
cd "$(dirname "$0")/../docs/handbook"

CHAPTERS="00-cover.md 01-one-question.md 02-inside-the-arena.md 03-strangers-you-can-trust.md 04-the-flywheel.md 05-small-numbers.md 06-running-the-machine.md 07-what-comes-next.md"
mkdir -p build

pandoc $CHAPTERS \
  --metadata title="Fact Mine, Debate Ground" \
  --metadata subtitle="Everything You Need to Know About YoTop10" \
  --metadata author="YoTop10" \
  --metadata date="September 2026 — First Edition" \
  --metadata lang=en-US \
  --toc --toc-depth=1 \
  --epub-cover-image=../../frontend/public/og-image.jpg \
  -o build/handbook.epub

pandoc $CHAPTERS \
  --metadata title="Fact Mine, Debate Ground" \
  --metadata subtitle="Everything You Need to Know About YoTop10" \
  --metadata author="YoTop10" \
  --metadata date="September 2026 — First Edition" \
  --metadata lang=en-US \
  --toc --toc-depth=1 \
  --css=print.css \
  --pdf-engine=weasyprint \
  -V margin-top=20mm -V margin-bottom=20mm -V margin-left=18mm -V margin-right=18mm \
  -o build/handbook.pdf

echo "Built: build/handbook.epub + build/handbook.pdf"
ls -la build/
