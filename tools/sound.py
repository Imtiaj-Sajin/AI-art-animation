"""Sound design: narration + synthesized ambience/SFX/music -> build/mix.wav

    python tools/sound.py episodes/01-flannan-isles

Everything is generated procedurally (no samples, no licensing). Per-scene ambience levels come
from script.json "soundscape"; one-shot effects come from each line's "sfx" list, timed relative
to that line's start in build/timeline.json. Ambience is ducked under the narration.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voicefx import studio  # noqa: E402

SR = 48000
CR = 100  # control rate for automation curves
rng = np.random.default_rng(7)


# ---------- helpers ----------
def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def brown(n):
    b = signal.lfilter([1.0], [1.0, -0.997], noise(n))
    b = hp(b, 20)
    return b / (np.abs(b).max() + 1e-9)


def smooth_random(n, rate_hz, seed_scale=1.0):
    """Slowly wandering 0..1 curve at audio rate."""
    k = max(4, int(n / SR * rate_hz) + 4)
    pts = rng.random(k)
    x = np.linspace(0, k - 3, n)
    i = x.astype(int)
    f = x - i
    f = f * f * (3 - 2 * f)
    return pts[i] * (1 - f) + pts[i + 1] * f


def env_adsr(n, a, d, sustain=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    return e * (1 - sustain) + sustain * np.minimum(1, t / max(a, 1e-4))


def reverb_ir(seconds=2.4, damp=3.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = noise(n) * np.exp(-t * damp)
    ir = lp(ir, 5000)
    ir[0] = 0
    return ir / np.sqrt((ir ** 2).sum())


IR = reverb_ir()


def reverb(x, wet=0.25):
    return x * (1 - wet) + signal.oaconvolve(x, IR)[: len(x)] * wet * 3


def note_hz(name):
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    semis = names[name[0]] + (1 if "#" in name else -1 if name[1] == "b" else 0)
    octave = int(name[-1])
    return 440.0 * 2 ** ((semis + (octave - 4) * 12) / 12)


# ---------- one-shot effects ----------
def sfx_boom(dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 30 + 50 * np.exp(-t * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    thump = lp(noise(n), 160) * np.exp(-t * 6) * 0.6
    return (tone + thump) * 0.9


def sfx_thunder(dur=5.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rumble = lp(brown(n), 260) * (np.minimum(1, t / 0.15) * np.exp(-t * 0.9))
    crack = hp(noise(n), 900) * np.exp(-t * 9) * 0.25
    flutter = 0.6 + 0.4 * smooth_random(n, 9)
    return (rumble * flutter * 1.4 + crack)


def sfx_hoot():
    out = np.zeros(int(2.2 * SR))
    for start, length, pitch in [(0.0, 0.5, 1.0), (0.62, 0.22, 1.05), (0.9, 0.62, 0.97)]:
        n = int(length * SR)
        t = np.arange(n) / SR
        f = 372 * pitch * (1 - 0.06 * t / length) + 4 * np.sin(2 * np.pi * 6 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * noise(n) * 0.3
        e = np.sin(np.pi * np.minimum(1, t / length)) ** 1.5
        s = int(start * SR)
        out[s:s + n] += tone * e
    return reverb(bp(out, 200, 1800), 0.35) * 0.55


def pluck(freq, dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = 2 * np.pi * freq * t
    tone = np.sin(w) + 0.45 * np.sin(2 * w) * np.exp(-t * 3) + 0.2 * np.sin(3 * w + 0.3) * np.exp(-t * 5) + 0.1 * np.sin(4.2 * w) * np.exp(-t * 8)
    return tone * np.exp(-t * 2.2) * np.minimum(1, t / 0.004)


def sfx_musicbox():
    melody = [("A4", 0.0), ("D5", 0.42), ("F5", 0.84), ("E5", 1.26), ("D5", 1.68), ("A5", 2.3),
              ("G5", 2.9), ("F5", 3.32), ("E5", 3.74), ("C#5", 4.16), ("D5", 4.8)]
    out = np.zeros(int(7.5 * SR))
    for name, at in melody:
        p = pluck(note_hz(name))
        s = int(at * SR)
        out[s:s + len(p)] += p[: len(out) - s]
    for name in ("D4", "A4"):          # soft bass under the last note
        p = pluck(note_hz(name), 2.6) * 0.5
        s = int(4.8 * SR)
        out[s:s + len(p)] += p[: len(out) - s]
    return reverb(out, 0.4) * 0.22


def sfx_horn(dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for base in (98.0, 146.8):
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
        ph = 2 * np.pi * np.cumsum(base * vib) / SR
        for h in range(1, 12):
            out += np.sin(h * ph) / h
    e = np.minimum(1, t / 0.18) * np.minimum(1, (dur - t) / 0.5)
    return reverb(lp(out * e, 900), 0.45) * 0.28


def sfx_flare():
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    seg = int(0.05 * SR)
    src = noise(n)
    for i in range(0, n, seg):           # rising whoosh: band sweeps upward
        c = 500 + 3500 * min(1, i / (1.2 * SR))
        chunk = bp(src[i:i + seg * 2], c * 0.7, min(c * 1.4, SR / 2 - 100))
        out[i:i + len(chunk)] += chunk[: n - i] * 0.5
    e = np.minimum(1, t / 0.08) * np.exp(-np.maximum(0, t - 1.1) * 3)
    pops = (rng.random(n) > 0.9993) * rng.random(n) * np.exp(-np.maximum(0, t - 1.2) * 2) * (t > 1.1)
    crackle = signal.lfilter([1], [1, -0.95], pops) * 0.5
    return reverb(out * e + crackle, 0.3) * 0.35


def sfx_ticks(dur):
    n = int((dur + 0.3) * SR)
    out = np.zeros(n)
    k = 0
    for at in np.arange(0, dur, 0.5):
        m = int(0.06 * SR)
        t = np.arange(m) / SR
        f = 2300 if k % 2 == 0 else 1750
        click = (np.sin(2 * np.pi * f * t) * 0.6 + hp(noise(m), 3000) * 0.4) * np.exp(-t * 90)
        s = int(at * SR)
        out[s:s + m] += click
        k += 1
    return reverb(out, 0.25) * 0.3


def sfx_door():
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    f = 260 + 140 * np.sin(np.minimum(1, t / 0.9) * np.pi / 2)
    creak = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (t < 0.9) * np.minimum(1, t / 0.1)
    creak = bp(creak, 300, 2000) * 0.15
    gust = bp(noise(n), 200, 1500) * np.minimum(1, np.maximum(0, t - 0.5) / 0.6) * np.exp(-np.maximum(0, t - 1.2) * 1.2)
    thud = lp(noise(n), 120) * np.exp(-np.maximum(0, t - 0.95) * 12) * (t > 0.95) * 2
    return reverb(creak + gust * 0.6 + thud, 0.3) * 0.6


def sfx_scratch():
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    strokes = (np.sin(2 * np.pi * 7 * t) > -0.2) * np.minimum(1, t / 0.02) * np.minimum(1, (1 - t) / 0.1)
    return bp(noise(n), 2200, 6500) * strokes * 0.12


def sfx_wave():
    n = int(7.0 * SR)
    t = np.arange(n) / SR
    swell = lp(brown(n), 400) * np.clip(t / 2.0, 0, 1) ** 2 * (t < 2.2)
    crash_env = (t > 2.0) * np.exp(-np.maximum(0, t - 2.0) * 0.7)
    crash = (lp(noise(n), 3000) * 0.6 + lp(brown(n), 300)) * crash_env
    boom = np.zeros(n)
    b = sfx_boom(4.0)
    boom[int(2.0 * SR): int(2.0 * SR) + len(b)] = b[: n - int(2.0 * SR)]
    return reverb(swell * 1.2 + crash * 1.3, 0.3) * 0.8 + boom * 0.6


def sfx_blip(dur=1.4, pitch=1.0):
    """Radio-telescope signal: a pure tone that swells and fades with a slight warble (pitch scales it)."""
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    f = 620 * (0.7 + 0.3 * pitch) * (1 + 0.004 * np.sin(2 * np.pi * 7 * t))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    hiss = bp(noise(n), 1500, 5000) * 0.08 * env
    return reverb((tone * 0.35 + hiss) * env, 0.35) * 0.5 * (0.6 + 0.4 * min(pitch, 3) / 3)


def sfx_static(dur=1.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    crackle = signal.lfilter([1], [1, -0.4], (rng.random(n) > 0.995) * noise(n)) * 0.6
    hiss = bp(noise(n), 900, 6000) * (0.5 + 0.5 * smooth_random(n, 6)) * 0.25
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.3)
    return (crackle + hiss) * env * 0.5


def sfx_printer(dur=2.0):
    """Dot-matrix printer chatter: bursts of fast clicks, line by line."""
    n = int(dur * SR)
    out = np.zeros(n)
    m = int(0.006 * SR)
    click = hp(noise(m), 2000) * np.exp(-np.arange(m) / SR * 700)
    at = 0.0
    while at < dur - 0.05:
        line_end = at + 0.28
        while at < min(line_end, dur - 0.01):
            s = int(at * SR)
            out[s:s + m] += click[: n - s] * (0.6 + 0.4 * rng.random())
            at += 0.011
        at += 0.12                          # carriage return
    return reverb(bp(out, 1500, 7000), 0.15) * 0.45


SFX = {
    "boom": lambda c: sfx_boom(), "thunder": lambda c: sfx_thunder(), "hoot": lambda c: sfx_hoot(),
    "musicbox": lambda c: sfx_musicbox(), "horn": lambda c: sfx_horn(), "flare": lambda c: sfx_flare(),
    "ticks": lambda c: sfx_ticks(c.get("dur", 3.0)), "door": lambda c: sfx_door(),
    "scratch": lambda c: sfx_scratch(), "wave": lambda c: sfx_wave(),
    "blip": lambda c: sfx_blip(c.get("dur", 1.4), c.get("pitch", 1.0)),
    "static": lambda c: sfx_static(c.get("dur", 1.5)), "printer": lambda c: sfx_printer(c.get("dur", 2.0)),
}


# ---------- ambience ----------
def automation(timeline, soundscape, key, n):
    """Per-scene level for one ambience parameter, crossfaded over ~1.6s, at audio rate."""
    m = int(n / SR * CR) + 2
    curve = np.zeros(m)
    for sc in timeline["scenes"]:
        v = soundscape.get(sc["id"], {}).get(key, 0.0)
        curve[int(sc["start"] * CR): int(sc["end"] * CR) + 1] = v
    k = int(1.6 * CR)
    curve = np.convolve(np.pad(curve, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    return np.interp(np.arange(n) / SR * CR, np.arange(len(curve)), curve)


def ambience(timeline, soundscape, n):
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for ch in range(2):
        # sea: low rumble that breathes with each wave, plus foam hiss on the crests
        period = 7.5 + ch * 0.9
        wave = (0.5 + 0.5 * np.sin(2 * np.pi * t / period + ch * 1.7 + 2 * smooth_random(n, 0.05))) ** 2.5
        sea = lp(brown(n), 380) * (0.35 + 0.65 * wave) + hp(lp(noise(n), 4000), 700) * wave ** 2 * 0.25
        gust = smooth_random(n, 0.25) ** 1.5
        wind = bp(noise(n), 250, 900) * (0.3 + 0.7 * gust) + bp(noise(n), 900, 2600) * gust ** 2 * 0.4
        rain = hp(noise(n), 2500) * 0.35 + signal.lfilter([1], [1, -0.6], (rng.random(n) > 0.998) * noise(n)) * 0.25
        a_sea = automation(timeline, soundscape, "sea", n)
        a_wind = automation(timeline, soundscape, "wind", n)
        a_rain = automation(timeline, soundscape, "rain", n)
        weather = sea * a_sea * 0.5 + wind * a_wind * 0.22 + rain * a_rain * 0.12
        muffle = automation(timeline, soundscape, "muffle", n)
        weather = weather * (1 - muffle) + lp(weather, 350) * muffle * 1.3   # heard from indoors
        out[:, ch] = weather
    return out


# ---------- score: a different chord, piano and pulse for every scene ----------
def pad_voice(freq, n, ch):
    """Warm string-like pad note: detuned saws through a lowpass, slow chorus."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.12, 0.0, 0.13):
        f = freq * (1 + det / 100 * (1 + 0.3 * ch)) * (1 + 0.0015 * np.sin(2 * np.pi * 0.2 * t + det * 9))
        ph = np.cumsum(f) / SR
        out += 2 * (ph % 1) - 1
    return lp(out, min(1400, freq * 5), 2) / 3


def score(timeline, music, n):
    out = np.zeros((n, 2))
    fade = 2.2
    for i, sc in enumerate(timeline["scenes"]):
        cue = music.get(sc["id"])
        if not cue:
            continue
        a = max(0.0, sc["start"] - fade / 2)
        b = min(n / SR, sc["end"] + fade / 2)
        s0, s1 = int(a * SR), int(b * SR)
        m = s1 - s0
        tt = np.arange(m) / SR
        env = np.minimum(1, tt / fade) * np.minimum(1, (m / SR - tt) / fade)
        swell = 0.75 + 0.25 * np.sin(2 * np.pi * tt / 9 + i)
        for ch in range(2):
            pad = sum(pad_voice(note_hz(nm), m, ch) * (1.0 if k == 0 else 0.6) for k, nm in enumerate(cue["chord"]))
            out[s0:s1, ch] += pad * env * swell * cue.get("pad", 0.5) * 0.06
        # piano: chord tones picked out slowly, an octave up, panned gently
        if cue.get("piano", 0) > 0:
            notes = cue["chord"][1:] + [cue["chord"][2]]
            r = np.random.default_rng(i + 11)
            at, k = 1.5, 0
            while at < m / SR - 2.5:
                nm = notes[k % len(notes)]
                f = note_hz(nm) * 2
                p = pluck(f, 3.0) * 0.5 + pluck(f * 2, 3.0) * 0.08
                st = s0 + int(at * SR)
                e = min(n, st + len(p))
                pan = 0.5 + 0.25 * np.sin(k * 1.7)
                out[st:e, 0] += p[: e - st] * cue["piano"] * 0.09 * (1 - pan) * 2
                out[st:e, 1] += p[: e - st] * cue["piano"] * 0.09 * pan * 2
                at += 2.6 + r.random() * 1.6
                k += 1
        # heartbeat pulse for tension: lub-dub at ~58 bpm
        if cue.get("pulse", 0) > 0:
            beat = np.zeros(m)
            hb = sfx_boom(0.5)[: int(0.5 * SR)] * np.exp(-np.arange(int(0.5 * SR)) / SR * 9)
            for st in np.arange(0.6, m / SR - 0.6, 60 / 58):
                for off, g in ((0, 1.0), (0.24, 0.6)):
                    j = int((st + off) * SR)
                    e = min(m, j + len(hb))
                    beat[j:e] += hb[: e - j] * g
            out[s0:s1] += (lp(beat, 140) * env * cue["pulse"] * 0.35)[:, None]
    return reverb(out[:, 0], 0.35)[:, None] * [1, 0] + reverb(out[:, 1], 0.35)[:, None] * [0, 1]


def main(ep_dir):
    ep = Path(ep_dir).resolve()
    script = json.loads((ep / "script.json").read_text(encoding="utf-8"))
    timeline = json.loads((ep / "build" / "timeline.json").read_text(encoding="utf-8"))
    n = int(timeline["duration"] * SR)

    narr, nsr = sf.read(ep / "build" / "narration.wav", dtype="float32")
    narr = signal.resample_poly(narr, SR, nsr)[:n]
    narr = np.pad(narr, (0, n - len(narr)))
    narr = studio(narr, SR) * 0.9          # dry, close, podcast-style: no reverb on the voice

    amb = ambience(timeline, script.get("soundscape", {}), n) * 1.6
    mus = score(timeline, script.get("music", {}), n)

    sfx = np.zeros(n)
    starts = {ln["id"]: ln["start"] for ln in timeline["lines"]}
    for ln in script["lines"]:
        for cue in ln.get("sfx", []):
            clip = SFX[cue["type"]](cue)
            s = int((starts[ln["id"]] + cue.get("at", 0)) * SR)
            s0 = max(0, s)
            clip = clip[s0 - s:]
            e = min(n, s0 + len(clip))
            sfx[s0:e] += clip[: e - s0]
            print(f"sfx {cue['type']:>9} @ {s / SR:6.2f}s")

    # duck ambience (not effects) under the voice
    win = int(0.3 * SR)
    csum = np.cumsum(np.pad(np.abs(narr), (win // 2, win - win // 2)))
    env = (csum[win:] - csum[:-win])[:n] / win
    env = np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
    amb *= (1 - 0.55 * env)[:, None]
    mus *= 0.42 * (1 - 0.35 * env)[:, None]   # sits ~14 dB under the voice, swells in the gaps

    mix = amb + mus + sfx[:, None] * 0.8 + narr[:, None]
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.93
    sf.write(ep / "build" / "mix.wav", mix.astype(np.float32), SR, subtype="PCM_16")

    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)
    speech = env > 0.3
    print(f"narration RMS {rms(narr[speech]):.1f} dB | ambience under speech {rms(amb[speech]):.1f} dB | music under speech {rms(mus[speech]):.1f} dB | music overall {rms(mus):.1f} dB")
    print("wrote", ep / "build" / "mix.wav")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "episodes/01-flannan-isles")
