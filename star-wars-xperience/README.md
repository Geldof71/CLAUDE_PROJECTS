# Star Wars Xperience: ruwe schets van het format

Opdracht van 60 minuten: maak zichtbaar hoe een eerste versie van ons format
voelt en verloopt. Het beeld komt uit onze eigen holomap van de route
(rondleiding van ruimte naar ruimte), de voice over vertelt het verhaal.

| Bestand | Inhoud |
| --- | --- |
| `1_verhaallijn.md` | Stap 1: begin, midden en eind van de ervaring |
| `star_wars_xperience_schets.mp4` | Stap 2: de gemonteerde video met audio, voor Portflow |
| `3_terugkijken.md` | Stap 3: wat wordt duidelijk en wat ontbreekt nog |
| `scripts/scenes.json` | Voice over tekst en bediening van de holomap per scene |
| `scripts/stem.py` | Maakt de voice over per scene |
| `scripts/opname.js` | Neemt de holomap rondleiding frame voor frame op |
| `scripts/mix.py` | Legt stem en een zachte ruimtebrom onder het beeld |

## Over de stem

De opdracht noemt ElevenLabs. Daar was in deze sessie geen toegang toe zonder
credits (de Higgsfield koppeling, waarmee ElevenLabs bereikbaar is, staat op 0
credits). Op verzoek is alles gratis gemaakt: de voice over is een lokale
Nederlandse neurale stem (Piper, stem `nl_NL-pim-medium`).

### Echte ElevenLabs stem inwisselen

1. Plak per scene de tekst uit `scripts/scenes.json` (veld `vo`) in ElevenLabs
   en download elk fragment als wav, met de scene id als naam, bijvoorbeeld
   `03_jedi_temple.wav`.
2. Zet de bestanden samen in een map, bijvoorbeeld `vo/`.
3. Neem opnieuw op en mix. De opname past de lengte van elke scene vanzelf aan
   de nieuwe stem aan.

```bash
NODE_PATH=$(npm root -g) node scripts/opname.js pad/naar/holomap/index.html vo opname
python3 scripts/mix.py opname vo star_wars_xperience_schets.mp4
```

Voor de opname zijn Playwright met Chromium en ffmpeg nodig. De holomap map
moet `vendor/` met three.js r128 bevatten.
