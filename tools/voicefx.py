"""Podcast/studio voice chain: dry, close, even. No reverb.

    high-pass 80 Hz -> cut boxiness (300 Hz) -> warmth (120 Hz shelf) -> presence (4 kHz)
    -> soft de-ess (7 kHz) -> RMS compressor 3:1 -> peak limiter -> normalize
"""
import numpy as np
from scipy import signal


def _biquad(kind, f0, sr, gain_db=0.0, q=0.707):
    """RBJ cookbook biquad -> (b, a)."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / sr
    cw, sw = np.cos(w), np.sin(w)
    alpha = sw / (2 * q)
    if kind == "peak":
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind == "lowshelf":
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) - (A - 1) * cw + sq), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sq)]
        a = [(A + 1) + (A - 1) * cw + sq, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sq]
    else:
        raise ValueError(kind)
    return np.array(b) / a[0], np.array(a) / a[0]


def _eq(x, sr, kind, f0, gain_db, q=0.707):
    b, a = _biquad(kind, f0, sr, gain_db, q)
    return signal.lfilter(b, a, x)


def _envelope(x, sr, ms):
    k = np.exp(-1.0 / (sr * ms / 1000))
    return signal.lfilter([1 - k], [1, -k], x)


def compress(x, sr, threshold_db=-24.0, ratio=3.0, attack_ms=8.0, release_ms=120.0):
    rms = np.sqrt(_envelope(x * x, sr, attack_ms) + 1e-12)
    level = 20 * np.log10(rms)
    over = np.maximum(0.0, level - threshold_db)
    gr_db = -over * (1 - 1 / ratio)
    gr_db = _envelope(gr_db, sr, release_ms)          # smooth gain changes (no pumping)
    return x * 10 ** (gr_db / 20)


def deess(x, sr, f0=7000.0, amount_db=-4.0):
    if sr <= 2 * f0:
        return x
    band = signal.sosfilt(signal.butter(2, [f0 * 0.8, min(f0 * 1.5, sr / 2 - 100)], "bandpass", fs=sr, output="sos"), x)
    env = np.sqrt(_envelope(band * band, sr, 3) + 1e-12)
    full = np.sqrt(_envelope(x * x, sr, 3) + 1e-12)
    sib = np.clip(env / full * 2.5, 0, 1)               # fraction of energy that is sibilance
    return x + band * sib * (10 ** (amount_db / 20) - 1)


def studio(x, sr, presence_db=2.5, warmth_db=1.5):
    x = np.asarray(x, np.float64)
    x = signal.sosfilt(signal.butter(2, 80, "highpass", fs=sr, output="sos"), x)
    x = _eq(x, sr, "peak", 300, -2.0, 1.0)
    x = _eq(x, sr, "lowshelf", 120, warmth_db)
    x = _eq(x, sr, "peak", 4000, presence_db, 0.9)
    x = deess(x, sr)
    x = compress(x, sr)
    peak = np.abs(x).max() + 1e-9
    x = np.tanh(x / peak * 1.2) / np.tanh(1.2)           # gentle limiter
    return (x / np.abs(x).max() * 0.89).astype(np.float32)   # -1 dBFS
