# Voice upgrade guide (for a GPU PC or a paid service)

**Why this exists:** the user wants the narration to sound like a *studio podcast recorded by a real
person*, not an AI voice. The current narrator is Kokoro `am_michael` (chosen by the user from 28 local
voices) because the original PC has a GeForce GT 710 (2 GB). That card is too weak for the better neural
TTS models. On a PC with a modern NVIDIA GPU, upgrade using this guide.

> Written 2026-10-28. TTS models change fast: check each project's current README, hardware needs and
> **license** before using it. A monetized YouTube channel is commercial use.

## Where the voice plugs in

Only one function needs to change: the per-line synthesis call in [`tools/tts.py`](../tools/tts.py):

```python
audio, sr = kokoro.create(ln.get("say", ln["text"]), voice=voice, speed=speed, lang=lang)
```

Everything downstream (timeline, animation sync, captions, studio chain in `tools/voicefx.py`, music
ducking in `tools/sound.py`) works with any engine that returns `(float32 mono samples, sample_rate)`
for one line of text. Recommended pattern: add `"engine": "kokoro" | "chatterbox" | "elevenlabs" | ...`
to `script.json` and dispatch on it in `tts.py`, keeping Kokoro as the fallback.

Keep these rules whatever the engine:

- Synthesize **line by line** (the timeline depends on per-line durations).
- Keep `say` (pronunciation spelling) support: "Eilean Mòr" is read as "Ellan More", "Archtor" as "Arktor".
- Never add reverb to the voice. `voicefx.studio()` handles EQ, de-essing and compression.
- After changing the voice, re-run `npm run voice`, then `npm run sound`, check stills at key moments
  (animation follows line ids, but long or short lines shift timing), then render.

## Options, best first

| Option | Sound | Needs | Notes |
|---|---|---|---|
| **Human narrator** (the user, or a hired voice actor) | Truly premium; no AI feel at all | A USB mic (e.g. Shure MV7, Rode PodMic/NT-USB) in a quiet, soft-furnished room; or a Fiverr/Voices.com narrator (~$20–60 per episode) | Record one take per script line, or one long take then split. Then align: put each line's audio where `tts.py` would put synthesized audio (see "Using recorded audio" below). |
| **ElevenLabs** | The closest AI to a studio narrator; strong storytelling and documentary voices | Paid plan that allows commercial use; API key | Audition at elevenlabs.io/voice-library. Store the key in env var `ELEVENLABS_API_KEY`, never in the repo. Their API returns MP3/PCM per request, which maps directly to per-line synthesis. |
| **Chatterbox** (Resemble AI, open source) | Very natural, with an emotion and "exaggeration" control; zero-shot voice cloning from a short reference clip | NVIDIA GPU, roughly 6–8 GB VRAM or more recommended; Python + PyTorch (CUDA) | Permissive license at the time of writing (verify). Good default for a local, free, high-quality narrator. |
| **Orpheus TTS** (Canopy Labs, open source) | Expressive; supports inline emotion tags (sighs, pauses) | Larger GPU (it's LLM-based); best with 12 GB+ VRAM | Check the license and model size you pick. |
| **F5-TTS** | Natural voice cloning | GPU ~6 GB+ | ⚠️ Pretrained weights were released under a **non-commercial** license; don't use them for a monetized channel unless that has changed. |
| **XTTS-v2** (Coqui) | Good cloning, many languages | GPU ~4 GB+ | ⚠️ Coqui Public Model License: **non-commercial**. Avoid for this channel. |
| OpenAI / Google / Azure TTS | Clean but noticeably AI | API key, pay per use (cents per episode) | Fine fallback; not "studio" level. |

**Voice cloning ethics:** clone only the user's own voice or a voice you have written permission and a
license to use. Never clone a celebrity or a real person without consent.

## Suggested path on a GPU PC

1. `nvidia-smi` to confirm the GPU and VRAM. Install a CUDA build of PyTorch matching the driver.
2. Install the chosen engine in a separate virtual environment (`python -m venv .venv-tts`) so it doesn't
   disturb the Kokoro setup.
3. Generate the audition line for each candidate voice. Extend `tools/voice_samples.py` with the new
   engine so the user can compare it side by side with `am_michael` in `out/voice-samples/index.html`.
   Let the user choose by ear: they pick voices themselves.
4. Add the engine to `tools/tts.py` behind `"engine"` in `script.json`, regenerate episode 01, and compare.
5. Record the decision in `CLAUDE.md` (voice, engine, settings) so future sessions keep using it.

## Using recorded audio (human narrator)

Simplest approach: record each line as its own file named by line id (`hook1.wav`, `hook2.wav`, ...) into
`episodes/NN-slug/voice/`. Then in `tts.py`, if `voice/<id>.wav` exists, load it instead of synthesizing,
trim silence the same way, and continue. Timeline, captions and sync all keep working. Recording tips:
15–20 cm from the mic, pop filter, record at 48 kHz/24-bit, leave 1 s of room tone at the start.
