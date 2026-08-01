# PPT V2 — Future Improvements

> Saved during V1 session. These are the upgrade goals for when we revisit PPT quality.

## Visual Fidelity
- [ ] Simulated glassmorphism via PNG overlays (blur isn't supported in PPTX natively)
- [ ] Gradient borders via SVG shapes in PPTX
- [ ] Subtle noise/dot texture packs as background PNGs
- [ ] Better color extraction from user branding (dynamic palette)
- [ ] AI-suggested accent colors per topic

## Smart Layout Engine
- [ ] Auto-balance text/media ratio per slide
- [ ] AI-detected focus points for content prioritization
- [ ] Better card grid layouts (2x2, 3-column, asymmetric)
- [ ] Smarter table styling (alternating rows, colored headers, highlight cells)

## Animations & Transitions
- [ ] Convert CSS animations → PowerPoint slide transitions
- [ ] Animated chart bars (grow from 0 to final height on slide open)
- [ ] Particle effects → PNG sequences as decorative layers

## Export Quality
- [ ] Higher resolution shape rendering
- [ ] Embedded fonts (if available) for consistency
- [ ] Better fallback when complex CSS can't map to PPTX (gradients → solid fill with note)

## AI Prompt Upgrades
- [ ] Topic-aware layout selection (data-heavy → tables, concept-heavy → cards)
- [ ] Auto-generate speaker notes from slide content
- [ ] Support for custom color themes passed from user input

## Python Compiler Upgrades
- [ ] Parse CSS gradients → approximate with solid fills or multi-shape overlays
- [ ] Parse `box-shadow` → separate drop shadow shapes
- [ ] Parse `backdrop-filter: blur()` → semi-transparent PNG overlay
- [ ] Support for `<img>` tags (download and embed into PPTX)
- [ ] Support for `<svg>` → convert to PPTX shapes
