# Claude projects

Gedeelde instellingen en skills voor Claude Code, te gebruiken in al onze
projecten.

## REA (Reverse Engineer Anything)

[REA](https://github.com/morluto/rea) laat Claude software onderzoeken waarvan
je de broncode niet hebt: websites, Electron apps, gebouwde webapps, APK's,
.NET programma's, binaries, HAR bestanden en meer. Elke conclusie komt met
bewijs. Alles draait lokaal. Vastgezet op versie 6.5.0.

Wat in deze repository staat:

| Bestand | Doel |
| --- | --- |
| `.claude/skills/rea/SKILL.md` | Onze eigen werkwijze: wanneer REA inzetten, welke route per type bestand, grenzen en hoe te rapporteren |
| `.claude/skills/reverse-engineer-anything/` | De officiële REA skill (uit het npm pakket 6.5.0), met naslag per onderwerp |
| `.mcp.json` | Registreert de REA MCP server voor dit project (via `npx`) |
| `scripts/installeer_rea.sh` | Installeert de CLI en kopieert beide skills naar `~/.claude/skills` |

### Gebruiken in andere projecten

**Op je eigen computer (aanrader).** Clone deze repository en draai eenmalig:

```bash
bash scripts/installeer_rea.sh --mcp
```

Daarna staan de skills en de MCP server in je persoonlijke Claude
configuratie en werken ze in elk project. Herstart Claude Code.

**In een ander project of een cloud sessie.** Kopieer de map `.claude/skills`
en het bestand `.mcp.json` naar dat project. Of voeg deze repository toe aan
de sessie en vraag Claude de REA skill te gebruiken; de CLI installeert Claude
dan zelf als die ontbreekt.

### Voorbeeldvragen

* "Gebruik REA om uit te zoeken hoe de zoekfunctie in deze Electron app werkt
  en bouw iets vergelijkbaars in mijn project."
* "Controleer de gebouwde versie van mijn Lovable app: lekken er sleutels mee
  en welke endpoints worden aangeroepen?"
* "Analyseer dit HAR bestand: welke data stuurt deze site naar buiten?"

### Extra software voor native analyse

Voor pseudocode van `.exe`, macOS apps en ELF binaries is Ghidra (gratis),
Hopper of IDA nodig. Zie de
[installatiehandleiding van REA](https://github.com/morluto/rea/blob/main/docs/installation.md).
JavaScript, websites, HAR, .NET, Go en Rust werken zonder.

### Updaten

Pas de versie aan in `.mcp.json`, `scripts/installeer_rea.sh` en
`.claude/skills/rea/SKILL.md`, en vervang de map
`.claude/skills/reverse-engineer-anything` door die uit het nieuwe npm pakket.

### Gebruik met verstand

REA is bedoeld voor eigen software, software waarvoor je toestemming hebt,
interoperabiliteit en beveiligingsonderzoek. Niet voor het omzeilen van DRM of
licenties, en niet om beschermde code over te nemen. Zie de
[disclaimer van REA](https://github.com/morluto/rea/blob/main/DISCLAIMER.md).
