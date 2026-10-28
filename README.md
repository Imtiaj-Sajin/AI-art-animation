# House of Owls — animation studio

Hand-drawn style story videos for the **House of Owls** YouTube channel: hidden, mysterious and forgotten
true stories, told with ink lines, crayon, watercolor and a narrator.

Every frame is drawn by code (HTML canvas, no AI images, no stock footage), so episodes are fully
editable, reproducible and copyright-clean. Voice and sound are generated locally too.

## Quick start (any machine)

Needs: Node 18+, Python 3.10+, Google Chrome (or Edge).

```bash
git clone https://github.com/Imtiaj-Sajin/AI-art-animation.git
cd AI-art-animation
npm install
npm approve-scripts ffmpeg-static && npm rebuild ffmpeg-static   # only if npm blocked the ffmpeg download
npm run setup                                                     # Python packages + voice model (~340 MB)
```

Build episode 1 end-to-end:

```bash
npm run voice  -- episodes/01-flannan-isles     # narration.wav + timeline (from script.json)
npm run sound  -- episodes/01-flannan-isles     # ambience + effects + music -> mix.wav
npm run render -- episodes/01-flannan-isles     # -> out/01-flannan-isles.mp4 (1080p, 24 fps)
```

Preview while working: open `episodes/01-flannan-isles/index.html` in Chrome (play, scrub, jump to scenes,
toggle subtitles). If the browser blocks local files, run `npx serve .` and open the page through it.

Useful render options:

```bash
npm run render -- episodes/01-flannan-isles --from 245 --to 280 --out out/test.mp4   # a section
npm run stills -- 12,95,270 episodes/01-flannan-isles --outdir out/stills          # PNG frames to check art
```

## Layout

| Path | What |
|---|---|
| `lib/hand.js` | Drawing engine: line-boil ink, crayon, watercolor washes, paper, light/darkness, sea, rain, lighthouse, ship, figures, handwriting |
| `lib/owl.js` | The House of Owls mascot (glasses, raised brow, lantern), glowing eyes, Owl Society emblem |
| `lib/fonts/` | Fonts used on screen (OFL), vendored so renders work offline |
| `tools/tts.py` | Narration with Kokoro TTS (local), writes the timeline everything syncs to |
| `tools/sound.py` | Procedural sound design: sea, wind, rain, drone, thunder, owl hoot, music box, horn... |
| `tools/render.mjs` | Headless-Chrome frame renderer + FFmpeg encode (parallel workers) |
| `episodes/NN-slug/` | One folder per episode: `research.md`, `script.json`, `index.html`, `scenes-*.js`, `youtube.md` |
| `docs/` | Workflow, style guide, episode ideas, [voice upgrade guide](docs/voice-upgrade.md) |
| `docs/context/` | Session logs: full history of decisions and fixes for the next AI session |
| `.claude/skills/new-episode/` | Claude skill: how to make the next episode in this house style |
| `seed-to-tree/` | The first test animation (tree growing through the seasons) |

## Making the next episode

Read [docs/workflow.md](docs/workflow.md). In short: research → `research.md` (fact-checked), script →
`script.json`, `npm run voice`, design scenes keyed to line timings, check stills, `npm run sound`, render.
With Claude Code, just ask: *"make the next House of Owls episode about …"*; the skill in
`.claude/skills/new-episode` carries the whole process.
