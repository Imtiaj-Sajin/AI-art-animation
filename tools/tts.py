"""Narration: script.json -> build/narration.wav + build/timeline.json/.js + build/captions.srt

    python tools/tts.py episodes/01-flannan-isles

Each line is synthesized separately with Kokoro (local, offline), then laid on one track with
pauses. The resulting timeline (when every line and scene starts) drives the animation and the
sound design, so visuals stay in sync with the voice. Lines with "hold" have no audio and just
reserve time (e.g. a title card). Use "say" for a pronunciation-friendly spelling of "text".
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "tools" / "models"


def srt_time(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def main(ep_dir):
    ep = Path(ep_dir).resolve()
    script = json.loads((ep / "script.json").read_text(encoding="utf-8"))
    build = ep / "build"
    build.mkdir(exist_ok=True)

    from kokoro_onnx import Kokoro
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    voice, speed, lang = script["voice"], script.get("speed", 1.0), script.get("lang", "en-us")
    sr = 24000

    pieces, lines, scenes = [], [], []
    t = 0.0
    prev_scene = None
    for ln in script["lines"]:
        if ln["scene"] != prev_scene:
            if prev_scene is not None:
                pad = script.get("scenePad", 0.8)
                pieces.append(np.zeros(int(pad * sr), np.float32))
                t += pad
                scenes[-1]["end"] = t
            scenes.append({"id": ln["scene"], "start": t})
            prev_scene = ln["scene"]
        lead = ln.get("lead", 0.0)
        if lead:
            pieces.append(np.zeros(int(lead * sr), np.float32))
            t += lead
        if ln.get("text"):
            audio, sr = kokoro.create(ln.get("say", ln["text"]), voice=voice, speed=speed, lang=lang)
            audio = np.asarray(audio, np.float32)
            nz = np.flatnonzero(np.abs(audio) > 0.01)      # trim synthesis silence at both ends
            if len(nz):
                audio = audio[max(0, nz[0] - 240): nz[-1] + 1200]
            dur = len(audio) / sr
            print(f"{ln['id']:>8}  {dur:5.2f}s  {ln['text'][:60]}")
        else:
            dur = ln.get("hold", 2.0)
            audio = np.zeros(int(dur * sr), np.float32)
        lines.append({"id": ln["id"], "scene": ln["scene"], "text": ln.get("text", ""), "start": round(t, 3), "end": round(t + dur, 3)})
        pieces.append(audio)
        t += dur
        pause = ln.get("pause", 0.4)
        pieces.append(np.zeros(int(pause * sr), np.float32))
        t += pause
    tail = script.get("tail", 2.0)
    pieces.append(np.zeros(int(tail * sr), np.float32))
    t += tail
    scenes[-1]["end"] = t

    track = np.concatenate(pieces)
    sf.write(build / "narration.wav", track, sr)
    timeline = {"title": script["title"], "duration": round(len(track) / sr, 3), "lines": lines, "scenes": scenes}
    (build / "timeline.json").write_text(json.dumps(timeline, indent=1), encoding="utf-8")
    (build / "timeline.js").write_text("window.TIMELINE = " + json.dumps(timeline) + ";\n", encoding="utf-8")

    srt, n = [], 0
    for ln in lines:
        if ln["text"]:
            n += 1
            srt.append(f"{n}\n{srt_time(ln['start'])} --> {srt_time(ln['end'])}\n{ln['text']}\n")
    (build / "captions.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"\n{len(lines)} lines, {len(scenes)} scenes, {timeline['duration']:.1f}s -> {build}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "episodes/01-flannan-isles")
