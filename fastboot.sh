#!/usr/bin/env bash
# Heroes of Eldria – snabbstart av dev-miljön.
#
#   ./fastboot.sh            installerar beroenden vid behov, bearbetar nya hjälte-, monster- och FX-bilder, startar Vite
#   ./fastboot.sh --check    kör även typecheck + lint + tester innan start
#   ./fastboot.sh --build    bygger till dist/ och startar preview-servern i stället för dev
#   ./fastboot.sh --port 3000
set -euo pipefail
cd "$(dirname "$0")"

PORT=5173
CHECK=0
BUILD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK=1 ;;
    --build) BUILD=1 ;;
    --port) PORT="$2"; shift ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "Okänd flagga: $1"; exit 1 ;;
  esac
  shift
done

echo "⚔  Heroes of Eldria fastboot"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js saknas – installera från https://nodejs.org (v20+)"; exit 1
fi
echo "   node $(node -v) · npm $(npm -v)"

# Installera beroenden om node_modules saknas eller package-lock är nyare
if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
  echo "📦 npm install"
  npm install --no-audit --no-fund
fi

# Frilägg nya hjältebilder (hoppar över de som redan finns)
if [[ -d art/raw ]]; then
  echo "🖼  hero-art + monster-art + fx-art"
  npm run -s hero-art
  npm run -s monster-art
  npm run -s fx-art
fi

if [[ $CHECK -eq 1 ]]; then
  echo "🔎 typecheck + lint + test"
  npm run -s typecheck
  npm run -s lint
  npm run -s test
fi

# Lokal IP för test på telefon
LAN_IP=$( (ipconfig 2>/dev/null | grep -m1 'IPv4' | sed 's/.*: //') || (hostname -I 2>/dev/null | awk '{print $1}') || true)

if [[ $BUILD -eq 1 ]]; then
  echo "🏗  npm run build"
  npm run -s build
  echo "🚀 preview på http://localhost:$PORT${LAN_IP:+  ·  telefon: http://$LAN_IP:$PORT}"
  exec npx vite preview --host --port "$PORT"
fi

echo "🚀 dev på http://localhost:$PORT${LAN_IP:+  ·  telefon: http://$LAN_IP:$PORT}"
echo "   Debug-panel: Ctrl+Shift+D · Landscape: F12 → Ctrl+Shift+M → rotera"
exec npx vite --host --port "$PORT"
