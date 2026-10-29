---
name: new-episode
description: Make a new House of Owls episode (research, script, voice, hand-drawn animated scenes, sound design, render) in the channel's house style. Use when the user asks for a new video, episode or story for House of Owls, or to continue or revise an existing episode.
---

# Make a House of Owls episode

First read `CLAUDE.md`, `docs/workflow.md` and `docs/style-guide.md`. Episode 01
(`episodes/01-flannan-isles/`) is the reference implementation: copy its structure.

## Steps

1. **Topic.** Pick from `docs/episode-ideas.md` or the user's request. Confirm the topic with the user if
   they didn't name one. Update its status to 🎬.
2. **Research** → `episodes/NN-slug/research.md`. Use WebSearch/WebFetch with several sources. Record
   verified facts with sources, myths to debunk, the theory you'll present, and TTS pronunciations.
   Never put an unverified claim in the narration.
3. **Script** → `script.json` following the beat structure in `docs/workflow.md`:
   - The cold-open hook comes first: the strangest concrete detail as a question, under 25 s.
   - The outro is always the Owl Society ending (never "subscribe"), ending on
     "A member of the Owl Society."
   - Add `sfx` cues on reveals, a `soundscape` per scene, and a `music` cue per scene (chord, pad, piano, pulse)
     so the score moves with the story. Voice: `am_michael` (en-us, 0.92).
4. **Voice:** `npm run voice -- episodes/NN-slug`. Check durations; fix pronunciations with `say`.
5. **Scenes:** copy `index.html` from episode 01, then write `scenes-1.js` / `scenes-2.js`.
   - Reuse `EP` helpers from episode 01's `scenes-1.js` (camAt, flashAt, bolt, rock, window, coat)
     by copying the helper block, or move shared helpers into `lib/` if a third episode needs them.
   - Reuse the title and outro scenes (owl + lantern + Owl Society) and change only the title text.
   - Each scene needs one creative visual device; key all timing to `k.at('lineId')`.
6. **Look at your frames.** `npm run stills -- <times> episodes/NN-slug --outdir out/stills`, then read
   the PNGs. Check legibility, overlaps, contrast in dark scenes, and that occluding objects hide what's
   behind them (`HD.occlude`). Iterate until every scene looks premium.
7. **Sound:** `npm run sound -- episodes/NN-slug`.
8. **Render:** `npm run render -- episodes/NN-slug` (runs in the background; ~10–15 min for 5 min).
9. **Shorts edit:** make `episodes/NN-slug-short/` (see `docs/workflow.md` §7): a 60–80 s vertical cut
   with burned-in captions that points viewers to the full episode.
10. **Publish kit:** write `youtube.md` (title options, description with sources and chapters from
   `build/timeline.json`, tags) and a thumbnail still. Update `docs/episode-ideas.md` to ✅.
11. **Write a session log** in `docs/context/YYYY-MM-DD-<topic>.md` (user requests, decisions, problems
    and fixes, open items). Don't commit or push: the user writes their own commit messages and pushes.

## Gotchas

- `**` after a unary minus is a syntax error in JS: write `-((x / k) ** 2)`.
- Big convolutions in `tools/sound.py` must use FFT (`oaconvolve`) or cumulative sums, never `np.convolve`
  on full-length audio.
- Washes over large rectangles must extend past the frame at the camera's widest zoom, or edges show.
- Text drawn on the ink layer goes under the darkness; draw it on `EP.top(L)` to stay readable at night.
