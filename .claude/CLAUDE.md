<!-- GSD:project-start source:PROJECT.md -->

## Project

**Tutor de Teoria Musical e Percepção**

Sistema pessoal de estudo diário de teoria musical, percepção auditiva e ritmo, para dar suporte à improvisação em jazz — principalmente no saxofone (secundariamente teclado e violão). Não envolve prática motora do instrumento: é o conhecimento e a percepção que alimentam essa prática, feita separadamente. Combina lições em markdown, sessões guiadas ao vivo com Claude, e widgets interativos de áudio (Web Audio) para "ouvir" os conceitos sendo explicados.

**Core Value:** Fechar a distância entre o que Manuel sabe na teoria e o que reconhece de ouvido em tempo real — o foco é treino auditivo aplicado à harmonia de jazz, não teoria abstrata desconectada do som.

### Constraints

- **Tempo**: ~15-20 min/dia — conteúdo e sessões devem ser dimensionados para isso, não sessões longas
- **Diretório**: projeto próprio (`teoria-musical/`), separado de outros projetos do usuário — vai acumular markdown, áudio e PDFs de referência
- **Fonte de referência parcial**: PDF do *Harmonia* (Ian Guest) disponível para consulta pontual de capítulos, não como espinha dorsal do currículo

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Web Audio API — `OscillatorNode` + `GainNode` | Native (all modern browsers) | Synthesize intervals, chord tones, ii-V-I voicings on the fly | Zero external assets, works entirely inside a sandboxed HTML artifact with **no network calls**. This is the only audio-generation approach that is 100% reproducible in the Artifact sandbox — sample/soundfont players need to fetch or embed instrument data (see "What NOT to Use"). |
| Plain markdown files (no PKM app lock-in) | — | Lesson content, one file per topic | Portable, diffable, and — per your existing Obsidian pilot — an Obsidian vault *is* just a folder of markdown + assets, so this KB drops into that workflow with zero migration cost. |
| Self-contained `<script>`-tag HTML | — | Ear-training / rhythm widgets embedded next to each lesson | Matches the Artifact constraint directly: one `.html` file, inline `<style>`/`<script>`, Web Audio only, opens by double-click with no build step or server. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Hand-rolled SVG/Canvas rhythm-strip renderer (~80-150 lines) | — | Draw simple quarter/eighth/rest rhythm patterns for dictation drills | **Default choice for rhythm dictation.** Jazz rhythm dictation rarely needs full staff notation with pitches — just a beam/notehead/rest strip. Hand-coding this avoids pulling in a ~500KB+ notation engine for a feature that's 10% of what that engine does. |
| VexFlow | 4.x / 5.x (TypeScript, dependency-free bundle) | Full staff notation (noteheads, clefs, beams, ties) when a drill needs *pitched* notation, not just rhythm | Reach for this only when a lesson needs real staff notation (e.g. writing out a ii-V-I voice-leading example to read). Its UMD/ESM build has **no runtime dependencies**, so the whole bundle can be pasted inline into a `<script>` tag in the artifact — no CDN fetch needed. Confirm bundle size before embedding; if it's too large for one artifact, keep notation-heavy lessons as static images/PDF excerpts instead. |
| ABCJS | latest | Alternative to VexFlow: write rhythms/melodies as compact ABC-notation text strings, get rendered notation back | Use if you'd rather author "rhythm as text" (e.g. `z2 A2 A4`) than build note objects programmatically — faster to hand-write short rhythm dictation patterns. Also dependency-free and embeddable inline. |
| Tap-timestamp comparator (hand-rolled, ~30 lines) | — | "Clap back" rhythm dictation: user taps spacebar/clicks in time, script compares tap timestamps (`performance.now()`) against the notated pattern's expected onsets | This is the **artifact-native substitute for microphone-based clap detection**. Mic input (`getUserMedia`) requires a permission grant the sandboxed artifact iframe generally won't have; tap-to-key/click needs no permissions and is fully self-contained. Functionally answers the same pedagogical question (rhythmic accuracy) without the mic dependency. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Browser DevTools only | Testing/debugging widgets | No build tooling needed — every widget is a single static HTML file, open directly in a browser or as a Claude Artifact. |
| Obsidian (already being piloted) | Optional viewer/organizer for the markdown lessons | Not required — plain folders + a text editor work identically — but since it's already in your personal-system pilot, use it as the browsing layer (backlinks, tags, graph view) over this same folder tree. |

## Directory Structure

- **No `/audio` folder by default.** Because playback is synthesized client-side via Web Audio oscillators, there's usually nothing to store — the widget *is* the sound source. Only add an `/audio` folder if you later record real saxophone reference licks or import an existing recording to ear-train against.
- **One lesson = one folder** (markdown + its widget together) so each topic is self-contained, easy to open standalone, and easy to hand a widget's HTML to Claude for editing without needing the rest of the tree for context.
- **Reference excerpts, not the full PDF.** Per your existing constraint (targeted excerpts, not cover-to-cover), only pull the specific pages/diagrams a lesson needs into `reference/`, cited with page numbers back to the source PDF.
- Works as-is inside an Obsidian vault (this *is* a valid vault) or as plain folders — no conversion needed either direction.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Oscillator/GainNode synthesis | `soundfont-player` / `WebAudioFont` (sample-based piano/instrument timbre) | Only if you move development outside the Artifact sandbox (e.g. a local HTML file you open directly in a browser with network access) and want realistic piano/sax timbre instead of sine/triangle tones. Inside an Artifact, these need a soundfont fetch or a multi-MB embedded payload — not practical. |
| Hand-rolled rhythm-strip renderer | VexFlow / ABCJS for rhythm-only drills | Once rhythm drills need multi-voice notation, ties across barlines, or mixed meter — beyond what a simple beam/rest strip communicates clearly. |
| Tap-to-key rhythm dictation | Microphone-based clap/tap detection (`web-audio-beat-detector` style peak analysis) | If you build this as a standalone local HTML file *outside* the Artifact sandbox (opened directly in a real browser tab, not the claude.ai iframe) where `getUserMedia` permission can actually be granted. |
| Custom jazz-specific drills (built as artifacts) | musictheory.net / Tenuto for generic interval/chord/scale-degree ID; Functional Ear Trainer (Alain Benbassat method) for scale-degree functional hearing | Use these free external tools for the generic, non-jazz-specific daily drilling (they're already built, tested, and better than anything worth re-building) — reserve custom artifacts for content these don't cover: ii-V-I in context, chord-scale relationships tied to *your* saxophone range/transposition, and drills sequenced to what a given lesson just covered. |
| — | EarMaster (paid, has a jazz harmony module) | Only if the free tools above feel insufficient and you're willing to pay a subscription; not required for the DIY approach this project is built around. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Soundfont/sample-based playback inside the Artifact (`soundfont-player`, `WebAudioFont`, embedding `.sf2`/`.sfz` data) | Requires either a network fetch (violates the no-network-calls constraint) or embedding megabytes of base64 sample data inline, which is impractical for a lesson-sized artifact | Oscillator + GainNode synthesis with a short ADSR envelope (sine or triangle wave, maybe layer a soft second harmonic for warmth) |
| Full VexFlow/ABCJS pipeline for simple rhythm-only drills | Overkill — pulls in a general staff-notation engine to draw what is functionally a beam-and-rest strip | Hand-rolled SVG/Canvas rhythm renderer, reach for VexFlow only when pitched notation is actually needed |
| Microphone-based "clap back" detection inside a Claude Artifact | The artifact iframe generally can't obtain `getUserMedia` permission; building around an assumption it will work leads to a dead-on-arrival feature | Tap-to-keypress/click timestamp comparison — same pedagogical value (rhythmic timing accuracy), zero permissions needed |
| Playing audio immediately on page load without a user gesture | Browsers block `AudioContext` autoplay; the widget will silently produce no sound with no visible error, which is confusing to debug mid-practice-session | Always create/`resume()` the `AudioContext` inside a click/keypress handler (e.g. a "Play" button) |
| Copying large sections of the Ian Guest PDF into markdown lesson files | Bloats the KB, duplicates copyrighted content unnecessarily, and this project already intends targeted excerpts only | Cite page/section numbers in `reference/`, extract only the specific diagram or example needed per lesson |

## Stack Patterns by Variant

- Use pure Web Audio oscillator synthesis, no library dependency at all
- Because the entire feature is achievable in ~100-200 lines of vanilla JS with zero external code
- Use a hand-rolled SVG rhythm strip + tap-timestamp comparator
- Because it's the smallest, fully self-contained solution and avoids embedding a general-purpose notation engine for a narrow need
- Use VexFlow (or ABCJS if you prefer authoring notation as text) with its bundle pasted inline into the artifact's `<script>` tag
- Because both ship dependency-free and work fully offline once inlined — just verify the pasted bundle stays under whatever size is comfortable for a single artifact; fall back to a static notation image if not
- Use musictheory.net/Tenuto (free, browser-based) and/or Functional Ear Trainer, not a custom-built artifact
- Because these are already mature, free tools purpose-built for exactly that, and re-implementing them is effort better spent on jazz-specific content these tools don't cover

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| Web Audio API (`OscillatorNode`, `GainNode`, `AudioContext`) | All evergreen browsers (Chrome, Firefox, Safari, Edge) and the Claude Artifact sandbox | No polyfill needed; this is a stable, long-shipped API. Only gotcha is the autoplay-gesture requirement noted above. |
| VexFlow 4.x/5.x bundle | Any modern browser, no other runtime dependency | Confirm you're grabbing the browser UMD/ESM build (not the Node-only entry point) if pasting inline. |
| ABCJS | Any modern browser, no other runtime dependency | Ships its own renderer; only pair with VexFlow if you specifically want VexFlow's rendering engine instead of ABCJS's own. |

## Sources

- [MDN — OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) — confirmed sine/square/triangle/sawtooth wave types, MEDIUM confidence (official docs, cross-checked)
- [DEV Community — A Browser Ear-Training Trainer in 350 Lines](https://dev.to/sendotltd/a-browser-ear-training-trainer-in-350-lines-equal-temperament-frequencies-and-three-web-audio-o0d) — practical worked example of an oscillator-based interval trainer and its AudioContext gotchas, LOW confidence (single blog post, not independently verified)
- [VexFlow official site](https://www.vexflow.com/) and [VexFlow GitHub](https://github.com/vexflow/vexflow) — dependency-free bundle, Canvas/SVG rendering, MEDIUM confidence
- [MatthewDorner/abcjs-vexflow-renderer](https://github.com/MatthewDorner/abcjs-vexflow-renderer) — confirms ABCJS-as-parser / VexFlow-as-renderer pairing exists as a known pattern, LOW confidence
- [GitHub — chrisguttandin/web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector) and [Beatport Engineering — Beat Detection Using JavaScript and the Web Audio API](http://joesul.li/van/beat-detection-using-web-audio/) — confirm mic/file-based beat detection technique and its `getUserMedia` dependency, LOW confidence
- [GitHub — danigb/soundfont-player](https://github.com/danigb/soundfont-player) and [WebAudioFont](https://surikov.github.io/webaudiofont/) — confirm sample-based players fetch external soundfont/JS payloads, MEDIUM confidence (official repos, cross-checked against the no-network constraint)
- [EarMaster](https://www.earmaster.com/) and general 2025/2026 ear-training app roundups (Sonofield, LANDR, Sing Theory) — confirm musictheory.net/Tenuto/Functional Ear Trainer/EarMaster landscape and pricing, LOW confidence (aggregator/blog content, not independently verified)
- Obsidian community forum threads on Zettelkasten folder structure — confirm plain-markdown-vault portability, LOW confidence (community discussion, not official documentation)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
