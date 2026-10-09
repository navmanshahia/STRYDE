#!/usr/bin/env bash
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$HOME/public_html/STRYDE"
if [[ "$SRC" == "$DEST" ]]; then echo "Already in site directory"; exit 0; fi
mkdir -p "$DEST" "$DEST/api" "$DEST/admin" "$DEST/images" "$DEST/models" "$DEST/assets"
for f in index.html styles.css stability.css app.js experience-v3.css experience-v3.js design-view.js stability.js 3d-viewer.js glb-engine.js repair.js commerce.js commerce.css .htaccess; do cp -f "$SRC/$f" "$DEST/$f"; done
for path in images models assets; do cp -a "$SRC/$path/." "$DEST/$path/"; done
for path in api admin; do cp -a "$SRC/$path/." "$DEST/$path/"; done
find "$DEST" -type d -exec chmod 755 {} \;
find "$DEST" -type f -exec chmod 644 {} \;
test -s "$DEST/index.html" && test -s "$DEST/api/index.php" && test -s "$DEST/images/aerodyne-one.png"
echo "STRYDE Commerce OS deployed to $DEST"
