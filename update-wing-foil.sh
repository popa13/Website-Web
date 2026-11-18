#!/bin/sh
# Wing Foil Simulation on the Mathopo website — puts the latest version of the game into apps/wing-foil/ and rebuilds the site.
#   sh update-wing-foil.sh [--push] [folder of the game]
# Default folder: ~/Documents/6-Informatique/0-FoilGame-Claude (where the game is developed).
# Only what the game needs is copied (index.html, css/, js/); apps/wing-foil/img/ holds the screenshots of the page and is left alone.
# Without --push: look at public/fr/wing-foil.html, then commit and push as usual (the commands are printed at the end).
# With --push: also commits the Wing Foil files and pushes (Netlify then publishes the new version).
set -e
cd "$(dirname "$0")"
PUSH=""
if [ "$1" = "--push" ]; then
  PUSH=1
  shift
fi
SRC="${1:-$HOME/Documents/6-Informatique/0-FoilGame-Claude}"
DST="apps/wing-foil"
if [ ! -f "$SRC/index.html" ] || [ ! -d "$SRC/css" ] || [ ! -d "$SRC/js" ]; then
  echo "The game (index.html, css/, js/) was not found in: $SRC" >&2
  exit 1
fi
mkdir -p "$DST/img"
# 1. the game itself — played at /apps/wing-foil/index.html (a file removed from the game is removed here too)
rm -rf "$DST/css" "$DST/js"
cp "$SRC/index.html" "$DST/index.html"
cp -R "$SRC/css" "$SRC/js" "$DST/"
# 2. the site
python3 build.py > /dev/null
echo "Wing Foil Simulation updated: $DST/ ($(du -sh "$DST" | cut -f1)) — the site is rebuilt in public/."
# 3. git (public/apps/wing-foil/ is in .gitignore: Netlify's build copies it from apps/wing-foil/)
FILES="apps/wing-foil content/en/wing-foil.md content/fr/wing-foil.md public/wing-foil.html public/fr/wing-foil.html"
if [ -n "$PUSH" ]; then
  git add $FILES
  if git diff --cached --quiet -- $FILES; then
    echo "No new Wing Foil Simulation changes to commit."
  else
    git commit -q -m "Wing Foil Simulation update" -- $FILES
    echo "Committed: Wing Foil Simulation update"
  fi
  git push   # also sends a commit left behind by an earlier push that failed
  echo "Done — Netlify publishes each push in a minute or two."
else
  echo "Check public/fr/wing-foil.html in a browser, then:"
  echo "  git add $FILES"
  echo "  git commit -m \"Wing Foil Simulation update\" && git push"
  echo "(or next time: sh update-wing-foil.sh --push)"
fi
