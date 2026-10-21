"""Legt de voice over op het opgenomen beeld en maakt de eindvideo.

Gebruik: python3 mix.py <opnamemap met beeld.mp4 en tijdlijn.json> <map met vo wavs> <uitvoer.mp4>

Onder de stem ligt een zachte, zelf gegenereerde ruimtebrom die wegduikt zodra
er gesproken wordt. Er wordt geen externe muziek gebruikt.
"""
import json
import subprocess
import sys
from pathlib import Path

rec, vo_dir, out = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
timeline = json.loads((rec / "tijdlijn.json").read_text())
total = timeline[-1]["end"]
fade_out = total - 1.2

args = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(rec / "beeld.mp4")]
for sc in timeline:
    args += ["-i", str(vo_dir / f"{sc['id']}.wav")]

parts = []
for i, sc in enumerate(timeline, start=1):
    ms = int(sc["voStart"] * 1000)
    parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,adelay={ms},apad=whole_dur={total}[v{i}]")
vo_in = "".join(f"[v{i}]" for i in range(1, len(timeline) + 1))
parts.append(f"{vo_in}amix=inputs={len(timeline)}:normalize=0,asplit=2[stem][key]")
parts.append(
    f"anoisesrc=color=brown:amplitude=0.6:sample_rate=48000:duration={total},lowpass=f=180,"
    f"aformat=channel_layouts=mono[ruis];"
    f"sine=frequency=55:sample_rate=48000:duration={total},volume=0.25[toon];"
    f"[ruis][toon]amix=inputs=2:normalize=0,volume=0.12,"
    f"afade=t=in:d=2,afade=t=out:st={fade_out}:d=1.2[brom]"
)
parts.append("[brom][key]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=500[bromduik]")
parts.append("[stem][bromduik]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=channel_layouts=stereo[a]")
parts.append(f"[0:v]fade=t=in:d=0.8,fade=t=out:st={fade_out}:d=1.2[v]")

args += ["-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", str(total), out]
subprocess.run(args, check=True)
print(f"{out}: {total:.1f} s")
