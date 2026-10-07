#!/bin/sh
# Verdelune on the Mathopo website — puts the latest version of the game into apps/verdelune/ and rebuilds the site.
#   sh update-verdelune.sh [--push] [folder that holds Verdelune.html]
# Default folder: ~/Documents/6-Informatique/00-PokeSmash/Verdelune (where each new version is delivered).
# Without --push: look at public/verdelune.html, then commit and push as usual (the commands are printed at the end).
# With --push: also commits the Verdelune files and pushes (Netlify then publishes the new version).
set -e
cd "$(dirname "$0")"
PUSH=""
if [ "$1" = "--push" ]; then
  PUSH=1
  shift
fi
SRC="${1:-$HOME/Documents/6-Informatique/00-PokeSmash/Verdelune}"
DST="apps/verdelune"
if [ ! -f "$SRC/Verdelune.html" ]; then
  echo "Verdelune.html not found in: $SRC" >&2
  exit 1
fi
mkdir -p "$DST/img"
# 1. the game itself (one HTML file, ~3 MB) — played at /apps/verdelune/index.html
cp "$SRC/Verdelune.html" "$DST/index.html"
# 2. the download for offline play: the game, its launchers and the README, in a zip
python3 - "$SRC" "$DST/Verdelune-offline.zip" <<'PY'
import os, shutil, sys, tempfile
src, out = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()
os.makedirs(os.path.join(tmp, 'Verdelune'))
for f in ['Verdelune.html', 'README.md', 'Play-Verdelune-Linux.sh', 'Play-Verdelune-Windows.bat', 'Play-Verdelune-macOS.command']:
    p = os.path.join(src, f)
    if os.path.exists(p):
        shutil.copy2(p, os.path.join(tmp, 'Verdelune', f))
base = out[:-4] if out.endswith('.zip') else out
shutil.make_archive(base, 'zip', root_dir=tmp, base_dir='Verdelune')
shutil.rmtree(tmp)
print('zip:', out, round(os.path.getsize(out) / 1e6, 2), 'MB')
PY
# 3. the site
python3 build.py > /dev/null
echo "Verdelune updated: $DST/index.html ($(du -h "$DST/index.html" | cut -f1)) — the site is rebuilt in public/."
# 4. git (public/apps/verdelune/ is in .gitignore: Netlify's build copies it from apps/verdelune/)
FILES="apps/verdelune content/en/verdelune.md content/fr/verdelune.md public/verdelune.html public/fr/verdelune.html"
if [ -n "$PUSH" ]; then
  git add $FILES
  if git diff --cached --quiet -- $FILES; then
    echo "No new Verdelune changes to commit."
  else
    git commit -q -m "Verdelune update" -- $FILES
    echo "Committed: Verdelune update"
  fi
  git push   # also sends a commit left behind by an earlier push that failed
  echo "Done — Netlify publishes each push in a minute or two."
else
  echo "Check public/verdelune.html in a browser, then:"
  echo "  git add $FILES"
  echo "  git commit -m \"Verdelune update\" && git push"
  echo "(or next time: sh update-verdelune.sh --push)"
fi
