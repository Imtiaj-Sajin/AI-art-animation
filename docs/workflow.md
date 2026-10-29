# Episode workflow

Typical episode: 4–6 minutes, 12–16 scenes, ~550–750 narrated words. Plan a day of work with Claude.

## 1. Pick and research the story

- Choose from [episode-ideas.md](episode-ideas.md) or a new topic that is **true, verifiable, and not
  over-covered**. Bangladeshi and South Asian forgotten history is a strong niche for this channel.
- Create `episodes/NN-slug/research.md`: a table of verified facts with sources, a **myths** section
  (things popular retellings get wrong), the theory you'll present (labelled as theory), and a
  pronunciation list for the TTS.
- Use at least two independent sources for each key fact. Prefer primary or near-primary sources
  (official reports, quoted letters, archives) over listicles.

## 2. Write the script (`script.json`)

Structure that works (see episode 01):

| Beat | Length | Purpose |
|---|---|---|
| **Hook** (cold open) | 15–25 s | The single strangest detail, framed as a question. No title yet. |
| Title card | ~8 s | Owl wakes, lifts lantern, title is written. Music box + hoot. |
| Setting | 20–30 s | Where and when (map, date). |
| People | 15–20 s | Who was involved; make them human. |
| The event | 60–90 s | Chronological, with concrete specifics (dates, numbers). |
| Clues | 45–60 s | What was found; payoff of the hook detail. |
| Myths vs record | 25–35 s | What the internet gets wrong. Builds trust. |
| Theory | 25–35 s | Most likely explanation, staged dramatically, clearly a theory. |
| Ending | 15–20 s | Quiet resolution, question for comments. |
| **Owl Society outro** | ~15 s | Never "subscribe". See CLAUDE.md. |

Line fields: `id`, `scene`, `text` (on-screen subtitle), optional `say` (pronunciation spelling for TTS),
`pause` (seconds after the line), `lead` (silence before), `hold` (silent line, e.g. the title card),
`sfx` (list of `{type, at, dur?}` with `at` relative to the line start; types: boom, thunder, hoot,
musicbox, horn, flare, ticks, door, scratch, wave). `soundscape` sets per-scene ambience levels
(`sea`, `wind`, `rain`, `muffle` = heard from indoors). `music` sets the per-scene score:
`{"chord": ["D2","A2","F3","A3"], "pad": 0..1, "piano": 0..1, "pulse": 0..1}`. Use a new chord when the
story turns, piano on reflective beats, and the heartbeat pulse on tense ones.

Writing tips: short sentences, ellipses for dramatic pauses ("One of them... hadn't."), and
specific numbers over adjectives.

## 3. Generate the voice

```bash
npm run voice -- episodes/NN-slug
```

Listen to `build/narration.wav`. Fix mispronunciations with `say`, then re-run. The channel narrator is
`am_michael`. To audition all voices with the studio chain: `python -I tools/voice_samples.py`, then open
`out/voice-samples/index.html`.

## 4. Design and build scenes

Copy episode 01's `index.html` (the player and transitions are generic). Write `scenes-*.js`:
each scene is `{ enter: {type: 'bleed'|'fade'|'cut', dur}, draw(L, k) }`. Inside `draw`:

- `k.at('lineId')` / `k.endOf('lineId')`: times of narration lines. **Always key animation to these.**
- `prog(t, start, dur)` → 0..1; `EP.camAt([...keys], t)` for camera moves; `HD.cam(L, cam)` to apply.
- Layers: `L.col` (crayon and watercolor, multiplied onto paper), `L.ink` (lines and text), `L.glow`
  (screen-blended light), darkness via `HD.darkness(L, alpha, lights, color, cam)`, then draw
  "above the night" text on `EP.top(L)`. `L.flash` and `L.fade` are full-frame flash and fade-to-black.
- Give every scene a **visual device**: a map that draws itself, an evidence board with red string,
  a calendar losing pages, a cut-away diagram with measurements, stamps over a myth...

Check frames constantly:

```bash
npm run stills -- 12,40,95 episodes/NN-slug --outdir out/stills
```

## 5. Sound

```bash
npm run sound -- episodes/NN-slug
```

Then preview with audio in the browser (`index.html`, press Play).

## 6. Render and publish

```bash
npm run render -- episodes/NN-slug       # out/NN-slug.mp4
```

Fill `episodes/NN-slug/youtube.md` (title, description with sources, chapters from the timeline, tags).
Upload `build/captions.srt` as subtitles. Make a thumbnail from the strongest still (big face or object,
3–4 words maximum).

## 7. YouTube Shorts edition

A Short must be vertical and at most 3 minutes, so it's a **separate edit**, not a resize. Reference:
`episodes/01-flannan-isles-short/`.

- Folder `episodes/NN-slug-short/` with its own `script.json` (60–80 s): 2-second text hook, the core mystery,
  the strongest evidence, the theory, then "The full story is on House of Owls" + Owl Society line.
- `index.html` calls `HD.setSize(1080, 1920)` before anything else, renders at 30 fps and burns in
  word-by-word captions (Fredoka, orange current word) at y ≈ 1345.
- Load the long episode's `scenes-1.js` for the `EP` helpers, then a `scenes-short.js` with scenes
  **composed for vertical** (stacked panels, cliff sections, a vertical peg wall).
- Safe zones (toggle "safe zones" in the preview): keep key art and text inside x 60–940, y 160–1460.
  The top bar, the right-hand buttons (x > 960, y 900–1500) and the bottom title overlay (y > 1500) cover the rest.
- Same pipeline: `npm run voice`, `npm run sound`, `npm run stills`, `npm run render` on the short folder.
