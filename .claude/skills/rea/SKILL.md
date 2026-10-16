---
name: rea
description: Werkwijze van Coen voor reverse engineering met REA (Reverse Engineer Anything). Gebruik deze skill wanneer de gebruiker wil weten hoe een feature in een bestaande app, website, Electron app, APK, .NET programma of binary werkt zonder broncode; wanneer een eigen gebouwde app (bijvoorbeeld Lovable of Supabase) gecontroleerd moet worden op gelekte sleutels, endpoints of netwerkverkeer; of wanneer een HAR bestand, firmware of onbekend bestand onderzocht moet worden. Niet gebruiken voor gewone analyse van een repository waarvan de broncode al beschikbaar is.
---

# REA werkwijze

REA is een open source MCP server en CLI (npm pakket `rea-agents`, bron
`github.com/morluto/rea`) die software lokaal onderzoekt en elke conclusie
koppelt aan bewijs (Evidence IDs). Deze skill beschrijft hoe ik het voor Coen
inzet. De officiële, uitgebreide instructies staan in de skill
`reverse-engineer-anything`; lees daar alleen het onderdeel dat bij het doel
past.

## 1. Eerst de grenzen

Controleer voor elke opdracht of het doel binnen deze grenzen valt. Twijfel je,
vraag het dan.

* Toegestaan: eigen software, software waarvoor toestemming is, begrijpen hoe
  een feature werkt, interoperabiliteit, beveiligingscontrole van eigen apps,
  verdachte bestanden analyseren.
* Niet doen: DRM, licentiechecks, anti cheat of inlogbeveiliging omzeilen,
  beschermde code of assets letterlijk overnemen, systemen van anderen testen
  zonder toestemming.
* Een feature nabouwen doe ik op basis van het begrip van het gedrag, met eigen
  code. Ik kopieer geen gedecompileerde code naar Coens projecten.
* Runtime analyse (browser, Electron, processen) voert het doel echt uit. Doe
  dat bij onbekende bestanden alleen in een afgeschermde omgeving, zoals een
  cloud sessie.

## 2. Zorg dat REA beschikbaar is

Kijk eerst of REA tools in de sessie staan (MCP server `rea`, tools zoals
`analyze_javascript_application`). Zo ja: direct naar stap 3.

Zo niet, gebruik de CLI. Installeer die alleen als hij ontbreekt:

```bash
command -v rea || npm install --global rea-agents@6.5.0
rea --version
```

Vereist Node.js 22.19 of hoger. Op Linux ook `ps` van procps (staat er meestal
al). De MCP server staat in `.mcp.json` van deze repository; in een nieuwe sessie
moet de gebruiker die server eenmalig goedkeuren. Lukt verbinden niet, lees dan
`reverse-engineer-anything/references/connection-and-recovery.md`.

Native analyse (exe, dylib, ELF pseudocode) heeft Ghidra, Hopper of IDA nodig.
Installeer die niet ongevraagd; meld wat ontbreekt en ga verder met wat zonder
kan.

## 3. Kies de route op basis van het doel

| Wat Coen aanlevert | Eerste stap |
| --- | --- |
| Map met JavaScript, gebouwde webapp (`dist`), Electron app of `.asar` | `rea analyze-javascript-application /absoluut/pad --json` |
| URL van een website | Browser scenario met de meegeleverde Chromium (`/opt/pw-browsers/chromium` in de cloud), daarna `export-web-scripts` en de JavaScript analyse |
| HAR bestand uit de browser (DevTools, tab Network, "Save all as HAR") | `rea inspect-web-network-capture /pad/bestand.har har` |
| .NET `.exe` of `.dll` | `rea inspect-managed-artifact` (zie `--help`) |
| Android APK | `inspect-android-package` (heeft JADX en Java nodig) |
| ZIP, DMG, IPA en andere pakketten | `rea inspect-artifact`, of `rea extract-artifact` om uit te pakken |
| Go of Rust binary | `rea inspect-go-binary` of `rea inspect-rust-binary`, geen extra software nodig |
| SQLite database | `rea inspect-sqlite-database` (Node.js 24.15 of hoger) |
| Native programma | `open_binary` met een provider (Ghidra, Hopper of IDA) |

Twijfel over argumenten: `rea <commando> --help` of `rea --llms-full`. Via MCP
gelden de schema's uit de toollijst.

Zegt Coen alleen "mijn app" zonder naam of pad, vraag dan welke. Kies nooit
zelf een voorbeeld.

## 4. Werk van samenvatting naar detail

* Begin klein. Bij grote apps eerst met `"detail": "summary"` en daarna gericht
  verder via `inspect_analysis_view` met het `parent_evidence_id`.
* CLI uitvoer met `--json` is JSON Lines: de eerste regels zijn voortgang
  (`rea_progress`), de laatste regel is het Evidence record. Sla grote uitvoer
  op in de scratchpad en filter met `--filter-output` of Python in plaats van
  alles in te lezen.
* Herhaal geen identieke analyse. Hergebruik Evidence uit eerdere stappen.
* Volg een feature van ingang (knop, route, IPC kanaal, API call) via de data
  tot het resultaat met `trace_application_feature`.

## 5. Rapporteer zo

Schrijf in het Nederlands, in gewone taal, zonder gedachtestreepjes. Gebruik
deze opbouw:

1. **Antwoord** op de vraag in een paar zinnen.
2. **Hoe het werkt**: de keten van stappen, met bestand, functie en regel waar
   mogelijk.
3. **Bewijs**: per bewering of het een *waarneming*, een *afleiding* of
   *onbekend* is, met Evidence ID. Statische analyse heeft niets zien draaien;
   zeg dat er ook niet bij.
4. **Beperkingen**: neem de `limitations` uit de uitvoer over als ze de
   conclusie raken.
5. **Volgende stap**: bijvoorbeeld een eigen implementatie, een runtime test of
   een fix voor een gevonden lek.

Bij een beveiligingscontrole van een eigen app: noem gevonden sleutels nooit
volledig in chat of commits. Geef alleen de plek en de eerste tekens.

## 6. Afronden

Sluit een geopende native sessie met `close_binary`. Wil Coen iets laten
bouwen, ga dan verder met de normale codeertools in het doelproject en houd
waargenomen gedrag en eigen ontwerpkeuzes uit elkaar.
