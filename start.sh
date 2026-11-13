#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

/usr/bin/time -p npm install --ignore-scripts --no-audit --no-fund --package-lock=false
/usr/bin/time -p npm run build

DEPLOYMENT_FILE="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}/deployment-output.json"
/usr/bin/time -p mkdir -p "$(dirname "$DEPLOYMENT_FILE")"
/usr/bin/time -p node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=process.cwd(); const directory=path.join(project,"dist"); fs.writeFileSync(process.argv[1], JSON.stringify({project,directory}, null, 2)+"\n")' "$DEPLOYMENT_FILE"

# Keep the static server attached to this process so the runtime can supervise it.
exec /usr/bin/time -p node serve.mjs
