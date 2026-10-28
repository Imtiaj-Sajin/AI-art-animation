"""Audition every local Kokoro English voice reading the same lines, with the studio chain applied.

    python -I tools/voice_samples.py            -> out/voice-samples/index.html (open in a browser)
"""
import html
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voicefx import studio  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "voice-samples"
TEXT = ("Three men lived on this island. When help finally arrived, all three were gone. "
        "Two of them had taken their coats. One of them... hadn't.")
LANG = {"a": "en-us", "b": "en-gb"}
ACCENT = {"a": "American", "b": "British"}


def main():
    from kokoro_onnx import Kokoro
    k = Kokoro(str(ROOT / "tools/models/kokoro-v1.0.onnx"), str(ROOT / "tools/models/voices-v1.0.bin"))
    voices = sorted(v for v in k.get_voices() if v[:2] in ("am", "af", "bm", "bf"))
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for v in voices:
        audio, sr = k.create(TEXT, voice=v, speed=0.92, lang=LANG[v[0]])
        sf.write(OUT / f"{v}.wav", studio(audio, sr), sr)
        gender = "male" if v[1] == "m" else "female"
        rows.append((v, f"{ACCENT[v[0]]} {gender}"))
        print(v)
    items = "\n".join(
        f'<li><b>{html.escape(v)}</b> <span>{html.escape(d)}</span><audio controls preload="none" src="{v}.wav"></audio></li>'
        for v, d in rows)
    (OUT / "index.html").write_text(f"""<!doctype html><meta charset="utf-8"><title>Voice samples</title>
<style>body{{font:15px system-ui;background:#141420;color:#eee;max-width:760px;margin:30px auto;padding:0 16px}}
li{{display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid #2a2a3a}}b{{width:110px}}
span{{width:140px;opacity:.7}}audio{{flex:1;height:32px}}</style>
<h1>Local voices (Kokoro, studio-processed)</h1><p>{html.escape(TEXT)}</p><ul>{items}</ul>""", encoding="utf-8")
    print("->", OUT / "index.html")


if __name__ == "__main__":
    main()
