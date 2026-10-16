#!/usr/bin/env bash
# Installeert de REA CLI en zet beide skills in je persoonlijke Claude map,
# zodat ze in al je projecten beschikbaar zijn.
#
# Gebruik:  bash scripts/installeer_rea.sh            (CLI en skills)
#           bash scripts/installeer_rea.sh --mcp      (ook MCP server voor Claude Code registreren)
set -euo pipefail

REA_VERSIE="6.5.0"
REPO_MAP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DOEL="${HOME}/.claude/skills"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ontbreekt. Installeer Node.js 22.19 of hoger en probeer opnieuw." >&2
  exit 1
fi

if command -v rea >/dev/null 2>&1 && [ "$(rea --version)" = "${REA_VERSIE}" ]; then
  echo "REA ${REA_VERSIE} is al geinstalleerd."
else
  echo "REA ${REA_VERSIE} installeren via npm..."
  npm install --global "rea-agents@${REA_VERSIE}"
fi

mkdir -p "${SKILL_DOEL}"
for skill in rea reverse-engineer-anything; do
  rm -rf "${SKILL_DOEL:?}/${skill}"
  cp -R "${REPO_MAP}/.claude/skills/${skill}" "${SKILL_DOEL}/${skill}"
  echo "Skill gekopieerd naar ${SKILL_DOEL}/${skill}"
done

if [ "${1:-}" = "--mcp" ]; then
  echo "MCP server registreren voor Claude Code. Eerst het plan:"
  rea setup --client claude_code --dry-run
  read -r -p "Doorgaan met deze wijzigingen? [j/N] " antwoord
  if [ "${antwoord}" = "j" ] || [ "${antwoord}" = "J" ]; then
    rea setup --client claude_code --yes
    # setup plaatst zijn eigen kopie van de officiele skill; die is gelijk aan de versie hierboven.
  fi
fi

echo "Klaar. Herstart Claude Code zodat de skills en tools geladen worden."
