"""Maakt per scene een voice over wav met een lokale Piper stem (sherpa-onnx).

Gebruik: python3 stem.py <map met stemmodel> <uitvoermap>
"""
import json
import sys
from pathlib import Path

import sherpa_onnx
import soundfile as sf

model_dir = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)
onnx = next(model_dir.glob("*.onnx"))

tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=str(onnx),
            tokens=str(model_dir / "tokens.txt"),
            data_dir=str(model_dir / "espeak-ng-data"),
            length_scale=1.08,
        ),
        num_threads=4,
    ),
))

scenes = json.loads((Path(__file__).parent / "scenes.json").read_text())
for sc in scenes:
    audio = tts.generate(sc["vo"], sid=0, speed=1.0)
    path = out_dir / f"{sc['id']}.wav"
    sf.write(path, audio.samples, audio.sample_rate)
    print(f"{path.name}\t{len(audio.samples) / audio.sample_rate:.2f}")
