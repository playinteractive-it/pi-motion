# PiMotion — Reference

GSAP + ScrollTrigger + SplitText motion engine, driven entirely by declarative HTML attributes. No per-project JS needed beyond calling `init()` once.

## Requirements

- GSAP **3.13+** (SplitText became free from this version; older versions will fail on import).
- `gsap`, `gsap/ScrollTrigger`, `gsap/SplitText` resolvable by your bundler. PiMotion registers `ScrollTrigger` and `SplitText` itself (registering them again elsewhere is harmless).

## Setup

```js
import { PiMotion } from './pi-motion.js';

document.addEventListener('DOMContentLoaded', () => {
  PiMotion.init(); // or PiMotion.init(document.querySelector('#app'))

  // If you use custom web fonts together with `split: lines`, re-run
  // init() once the fonts have swapped in, so line breaks are measured
  // against the final layout rather than the fallback font. init() is
  // safe to call again: it reverts and re-splits automatically.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => PiMotion.init());
  }
});
```

- `PiMotion.init(scope?)` — scans `scope` (default `document.body`) for `[pi-animate]`, `[pi-scroll]`, `[pi-stack]`, `[pi-pin]`, `[pi-flow]` and wires them up. Call once, after the target DOM exists. Calling it again (e.g. after fonts load, or on a new SPA route) is safe and self-cleaning — it reverts the previous setup internally before rebuilding.
- `PiMotion.destroy()` — reverts everything (ScrollTriggers, pins, SplitText instances). `init()` already calls this internally at the start of every run, so you only need to call it yourself when you want to tear everything down **without** immediately calling `init()` again (e.g. leaving a page for good in an SPA).
- `PiMotion.refresh()` — recomputes every ScrollTrigger's start/end position and every fill-mode parallax delta, without re-splitting text or rebuilding triggers. Call it after a layout change ScrollTrigger's own resize observer won't catch on its own: a lazy-loaded image finishing decode, an accordion or tab panel opening, content injected via AJAX. A plain browser window resize already triggers this automatically — you don't need to call it for that.
- `PiMotion.flowStats()` — a diagnostic for `[pi-flow]`, meant for the browser console. Returns `{ braked, ticker, frameAvgMs, runners }`: `braked` is `true` once the safety brake has switched the effect off (see [`[pi-flow]`](#pi-flow--fluid-lag-across-a-text)), `ticker` tells whether the shared scroll loop is running, and every entry of `runners` reports one text with its `parts`, `amountPx`, `curve`, `ref`, `smooth`, `lag`, whether it is `inView`, whether it is `moving` and its current `peak` (0 to 1).

## Config syntax

Every attribute value is a `;`-separated list of `key: value` pairs:

```html
pi-animate="type: fade; dur: 1; delay: 0.2; ease: power2.out"
```

- Booleans: `true` / `false`.
- Numbers: any bare number (`100`, `0.05`, `-50`).
- Everything else is read as a string (`top bottom`, `power2.out`, a CSS selector...).
- A value may optionally be wrapped in a single matching pair of quotes (`target: '#hero'` or `target: "#hero"`) — the quotes are stripped automatically before the value is used, so `target: #hero` and `target: '#hero'` behave identically. Quoting is only useful for readability; it's never required.
- A `mobile: { ... }` block overrides any of the above under **max-width: 768px**. Above that (**min-width: 769px**) the root values apply.

```html
pi-scroll="type: parallax; speed: 300; mobile: { speed: 100; disable: true }"
```

> **Known limitation:** the parser splits on `;` and reads a `mobile: { ... }` block with a simple regex. A selector that itself contains a literal `;` or `}` (e.g. an attribute selector like `[data-x="a;b"]`) will break the parsing. Keep selectors simple (id/class/tag) when used inside these attributes.

---

## `[pi-animate]` — one-shot reveal

Fires once when the element enters the viewport (`ScrollTrigger`, not scrubbed).

| Param | Default | Applies to | Meaning |
|---|---|---|---|
| `type` | `fade` | all | `fade` \| `slide-up` \| `slide-down` \| `slide-left` \| `slide-right` \| `split` \| `scale` |
| `dur` | `0.8` | all | duration in seconds |
| `delay` | `0` | all | delay in seconds before it starts |
| `ease` | `power2.out` (`power3.out` for `split`) | all | GSAP ease name |
| `dist` | `40` (`60` for `split`) | `slide-*`, `split` | travel distance in px |
| `reverse` | `false` | all | if `true`, the element (or its split parts) animates back out on `onLeave`/`onLeaveBack` and replays on re-entry |
| `target` | the element itself | all | `parent`, or any CSS selector, for the ScrollTrigger trigger element — see "Reveals inside a pinned section" below |
| `start` | `top 88%` | all | ScrollTrigger start position |
| `end` | `bottom 12%` | all | ScrollTrigger end position (only matters when `reverse: true`) |
| `split` | `words` | `type: split` only | `words` \| `lines` |
| `stagger` | `0.05` | `type: split` only | seconds between each word/line |
| `blur` | *(off)* | `type: split` only | adds a blur-in (px) alongside the slide |
| `disable` | `false` | all | skips the effect entirely, clears any inline styles |

`dist` has no visible effect on plain `fade` (it's only used by `slide-*` and `split`).

### Examples

Plain fade, once:
```html
<div pi-animate="type: fade">Content</div>
```

Fade that replays every time you scroll past it:
```html
<div pi-animate="type: fade; reverse: true">Content</div>
```

Slide up from below, slower, with an easing curve:
```html
<div pi-animate="type: slide-up; dist: 60; dur: 1.2; ease: power1.out">Content</div>
```

Different behavior on mobile (shorter distance under 768px):
```html
<div pi-animate="type: slide-left; dist: 80; mobile: { dist: 20 }">Content</div>
```

Headline: words slide in from the right, staggered:
```html
<h1 pi-animate="type: split; split: words; stagger: 0.06; dist: 80">
  Motion that follows the scroll.
</h1>
```

Same, but each word also blurs in:
```html
<h1 pi-animate="type: split; split: words; stagger: 0.06; dist: 80; blur: 12">
  Motion that follows the scroll.
</h1>
```

Line-by-line instead of word-by-word:
```html
<p pi-animate="type: split; split: lines; stagger: 0.1">
  A longer paragraph that breaks over several lines,
  revealed one line at a time as it enters the viewport.
</p>
```

> If this paragraph uses a custom web font, split it after the font has swapped in (see the Setup section) — otherwise the lines can be measured against the fallback font's metrics.

### Reveals inside a pinned section

By default `pi-animate`'s `start`/`end` are measured against the element's own position as it scrolls through the viewport. Once that element is pinned (frozen on screen for a scroll distance), its own position stops changing for the whole pin — so the default `start: top 88%` / `end: bottom 12%` describe a moment that happens **before** the pin ever engages, not while the user is actually looking at the pinned section. In practice this shows up as: the reveal appears to have already finished by the time the section locks into view, or — with `reverse: true` — the element gets hidden again at a point that doesn't correspond to when the pin actually ends, and stays hidden for the rest of it.

The fix is the same principle already used to sync `pi-scroll` with a pin: point `target` at the pinned section and give it the **same `start`/`end`** as the `pi-pin`. That ties the reveal to the pin's own scroll range instead of the element's own (now largely meaningless, because frozen) position.

```html
<section id="questions" pi-pin="end: +=2400" style="height:100vh; position:relative;">
  <h2 pi-animate="type: fade; target: '#questions'; start: top top; end: +=2400; delay: 0.3">
    Every section starts with a question.
  </h2>
  ...
</section>
```

`delay` (already in the table above) is a plain GSAP tween delay in seconds, applied after the trigger fires — useful here to let the pin visually "settle" for a beat before the title starts fading in.

---

## `[pi-scroll]` — continuous scroll-linked effect

Scrubbed to the scrollbar (or eased, see `scrub`) for as long as the trigger transits `start` → `end`.

### Shared params (all types)

| Param | Default | Meaning |
|---|---|---|
| `type` | `parallax` | `parallax` \| `fade` \| `split` \| `scale` \| `text-reveal` |
| `target` | the element itself (or its parent when `fill: true`) | `parent`, or any CSS selector, for the ScrollTrigger trigger element |
| `start` | `top bottom` | ScrollTrigger start position |
| `end` | `bottom top` | ScrollTrigger end position |
| `scrub` | `true` | `true` = tied 1:1 to the scrollbar (no lag); a number = seconds of easing lag; `false` disables scrubbing |
| `blur` | *(off)* | adds a `filter: blur()` transition (px). Works with `parallax`, `fade` and `split`, though each applies it a little differently; see each type's own table below |
| `disable` | `false` | skips the effect entirely |
| `horizontal` | `false` | `true` or a CSS selector. For elements carried sideways by a horizontal track: `start`/`end` use `left`/`right` instead of `top`/`bottom`. See "Horizontal scroll" below |

A `target` that isn't a valid CSS selector (e.g. malformed syntax) or that matches nothing logs a `console.warn` and falls back to the default trigger — it never throws.

### `type: parallax`

| Param | Default | Meaning |
|---|---|---|
| `axis` | `y` | `x` \| `y` |
| `speed` | `100` | px the element travels, from its natural position (`0`) to `speed`, over the full `start`→`end` transit |
| `reverse` | `false` | flips the direction of the travel (negates `speed`, or the `fill` delta) |
| `fill` | `false` | see below — replaces `speed` with an auto-computed distance |

**Fixed speed** — simple, predictable, anchored at the element's natural CSS position (never jumps on load regardless of how large `speed` is):

```html
<div pi-scroll="type: parallax; axis: y; speed: 300">
  <img src="photo.jpg">
</div>
```

Reversed direction:
```html
<div pi-scroll="type: parallax; axis: y; speed: 300; reverse: true">
```

Shorter, punchier travel window (movement concentrated as the element enters, not spread across its whole visibility):
```html
<div pi-scroll="type: parallax; speed: 300; start: top bottom; end: top top">
```

**Fill mode** (`fill: true`) — no `speed` to guess: the element travels exactly the size difference between it and its container on `axis`, so it always ends up flush with the container's far edge. Works in **both directions**:

- Element **smaller** than its container (e.g. a short title column next to a taller text column) → it travels down/right to meet the far edge.
- Element **larger** than its container (e.g. an oversized image cropped by an `overflow: hidden` box) → it travels up/left by its own overflow, panning inside the box without ever exposing an edge.

The delta is measured live via `getBoundingClientRect()`, and recomputed on every `ScrollTrigger.refresh()` (window resize does this automatically). This means the container's height doesn't need to be a fixed pixel value — `%`, `vh`, `aspect-ratio`, or a JS-driven size all work equally well, as long as it resolves to something other than `auto` (an absolutely-positioned fill element doesn't contribute to an `auto`-height container, so there would be nothing to measure against).

Two-column "fill the taller sibling" layout — `pi-scroll` goes on an inner wrapper, not directly on a flex/grid item (a stretched flex/grid item already has the container's full height, leaving nothing to fill):
```html
<div class="row" style="display:flex;">
  <div class="col-title"> <!-- stretched by flex, unchanged -->
    <div pi-scroll="type: parallax; axis: y; fill: true">
      <h2>Title</h2>
    </div>
  </div>
  <div class="col-text">
    <p>Long description…</p>
  </div>
</div>
```

Image panning inside a cropped box, no gaps, no manual px guessing. The box's height is set with `aspect-ratio` here rather than a fixed px value, to make clear that any explicit, non-`auto` height works — this is not a technique limited to fixed pixel layouts:
```html
<div class="box" style="overflow:hidden; position:relative; aspect-ratio: 4 / 3;">
  <img
    src="photo.jpg"
    pi-scroll="type: parallax; axis: y; fill: true"
    style="position:absolute; top:0; left:0; width:100%; height:130%; object-fit:cover;"
  >
</div>
```
The `height:130%` is what gives the image room to pan — `fill: true` computes the exact travel automatically from that; the percentage just needs to be *at least* enough for the effect you want, it doesn't need to match any JS value. Using an explicit `height:130%` here (rather than the image's intrinsic aspect ratio) is deliberate: it lets the fill delta be measured correctly even before the image has finished loading.

If the box's own size can change after this runs without a window resize (e.g. it sits inside an accordion, a tab panel, or its content is loaded via AJAX), call `PiMotion.refresh()` once that change settles — see the Setup section.

Parallax combined with a blur transition:
```html
<div pi-scroll="type: parallax; speed: 200; blur: 15">
```

### `type: fade`

| Param | Default | Meaning |
|---|---|---|
| `fade` | `in-out` | `in` \| `out` \| `in-out` |

- `in` — opacity `0 → 1` over `start`→`end`. With `blur`, the filter goes `blur(<px>) → blur(0)` over the same span.
- `out` — opacity `1 → 0` over `start`→`end`. With `blur`, the filter goes `blur(0) → blur(<px>)` over the same span.
- `in-out` — fades in over the first ~30% of the transit, holds fully opaque for the middle ~40%, fades out over the last ~30%. Fixed proportions, not configurable per-call. With `blur`, the filter mirrors this: `blur(<px>) → blur(0)` during the fade-in segment, **no blur during the hold** (the element stays sharp while fully visible), then `blur(0) → blur(<px>)` during the fade-out segment.

```html
<div pi-scroll="type: fade; fade: in-out">Content</div>
```

Fade-out combined with blur (e.g. a title blurring away as a pinned section ends):
```html
<h1 pi-scroll="type: fade; fade: out; blur: 15; target: '#hero'; start: top top; end: +=1200">
  Title
</h1>
```

### `type: split`

Same word/line slide-in as `pi-animate`'s `split`, but scrubbed instead of firing once.

| Param | Default | Meaning |
|---|---|---|
| `split` | `words` | `words` \| `lines` |
| `stagger` | `0.05` | seconds of stagger between parts (scaled into the scrub range) |
| `dist` | `60` | px each part starts offset by |
| `blur` | *(off)* | blur-in amount (px) per part, tied to the same scrub as the slide |

```html
<h1 pi-scroll="type: split; split: words; stagger: 0.06; dist: 80; start: top bottom; end: top 40%">
  Title
</h1>
```

If this uses `split: lines` with a custom web font, re-run `init()` once fonts have swapped in — see the Setup section.

### `type: scale`

Scales the element only (no opacity change). Available on both `pi-scroll` (scrubbed) and `pi-animate` (fires once on enter).

| Param | Default | Meaning |
|---|---|---|
| `scale` | `in` | `in` \| `out` |
| `amount` | `1.2` | the scale value (number > 0) |
| `origin` | *(not set: keeps the CSS `transform-origin`)* | any CSS transform-origin: `center`, `left center`, `50% 100%`... |

- `in` — scale goes from `amount` to `1`.
- `out` — scale goes from `1` to `amount` (the maximum).
- With `pi-animate`, the usual `dur`, `delay`, `ease`, `reverse`, `target`, `start`, `end` apply; `dist` doesn't. `pi-animate` does not check `prefers-reduced-motion`; a `pi-scroll` scale stays still under reduced motion only when `motion-safe: true` is set.
- The element's own `transform: scale(...)` in CSS is replaced while the effect runs and restored when it is disabled. Don't put `type: scale` on an element that already has a `pi-scroll` parallax: put it on a wrapper (an element takes only one `pi-scroll`).
- Default trigger is the element itself; its bounding box changes while it scales. If start/end look shifted, point `target` at a non-scaled parent or wrapper.

```html
<figure pi-scroll="type: scale; scale: in; amount: 1.4; origin: center; start: top bottom; end: top 30%">
<figure pi-scroll="type: scale; scale: out; amount: 1.3; target: '#hero'; start: top top; end: +=1200">
<div pi-animate="type: scale; scale: in; amount: 0.85; dur: 1">
```

### `type: text-reveal`

The text starts dim and becomes fully opaque piece by piece as you scroll, in reading order, with no movement. Scrubbed to the scrollbar.

| Param | Default | Meaning |
|---|---|---|
| `split` | `chars` | `chars` \| `words` \| `lines` |
| `opacity` | `0.08` | opacity of the text before its turn comes (0 to 1) |
| `snap` | `true` | `true` = each piece switches to full opacity instantly; `false` = same order, but each piece fades in linearly |

- Default `start: top 75%` and `end: bottom 45%` (with `horizontal`: `left right` → `right left`), different from the other `pi-scroll` types. Every piece gets an equal slice of that range.
- With `split: chars`, words never break across lines.
- Waits for the text like the other split types (see Notes & gotchas), and inline markup inside the element (e.g. `<br>`) is kept.
- Inside a pinned section use `target` with the same `start`/`end` as the pin, as for the other types.
- With `motion-safe: true` and a reduced-motion OS setting, the text stays fully visible.
- Its ScrollTriggers are refreshed after the others (`refreshPriority: -1`), so a text below a pin created later in the page is measured with the pin spacing included.

```html
<h4 pi-scroll="type: text-reveal; split: chars; opacity: 0.08; start: top 75%; end: bottom 45%">
  Text that lights up as you read.
</h4>
```

### Horizontal scroll (`horizontal`)

`axis: x` only says **which way the element moves**. When the effect starts and ends is set by `start`/`end`, and by default those are **vertical** (`top`/`bottom` of the viewport). That is wrong for an element carried sideways by a horizontal track inside a pinned section: its vertical position never changes, so every element would start at the same moment — when the pin starts — however far to the right it sits.

`horizontal` tells pi-motion "this element rides on a horizontal track": `start`/`end` are then measured **left/right** instead of top/bottom, as the track carries the element across the viewport.

| `horizontal` | Meaning |
|---|---|
| `true` | use the **closest ancestor** that is moved by a `pi-scroll` with `axis: x` (the track) |
| `<selector>` | pick that ancestor explicitly — only needed with nested tracks |

- Defaults with `horizontal`: `start: left right` (the element's left edge enters from the right edge of the viewport) → `end: right left` (its right edge leaves from the left edge). Any ScrollTrigger horizontal position works, e.g. `start: left 80%`.
- It is independent from `target`: `target` picks the element that triggers the effect vertically (e.g. a pinned section); with `horizontal` the trigger is the element itself, so `target` is not needed.
- The track needs its own `pi-scroll="type: parallax; axis: x; ..."` (typically `fill: true`, `ease` is linear by design).
- If no such ancestor exists (e.g. the track's parallax is disabled on mobile), or the selector is invalid, pi-motion logs a `console.warn` and falls back to the normal vertical behaviour. It never throws.
- Works with all the types (`parallax`, `fade`, `split`, `scale`, `text-reveal`).

Horizontal track in a pinned section, images drifting left only while they cross the viewport:
```html
<section id="skills" pi-pin="end: +=2400">
  <div class="track"
       pi-scroll="type: parallax; axis: x; fill: true; target: '#skills'; start: top top; end: +=2400">
    <figure class="slide"
            pi-scroll="type: parallax; axis: x; speed: 70; reverse: true; horizontal: true"></figure>
    <figure class="slide"
            pi-scroll="type: parallax; axis: x; speed: 70; reverse: true; horizontal: true"></figure>
  </div>
</section>
```

---

## `[pi-stack]` — cycle through children, scrubbed to scroll

Cycles through an element's **direct children** one at a time: each one slides/fades out while the next slides/fades in. `end - start` is split into one equal segment per transition, so adding or removing a child just reflows the timing — no index or count to configure. Needs at least 2 direct children; fewer logs a warning and does nothing.

Every child is stacked into the same box (`position: absolute`, same top/left/width) and the container is locked to the **tallest child's height**, so anything above it (typically a pinned title) never jumps as the visible child changes. The lock is re-measured on every `ScrollTrigger.refresh()` (e.g. a window resize).

Meant to live inside a `pi-pin` section, with the **same `start`/`end`** as the pin — same principle already used to sync `pi-scroll` to a pin.

| Param | Default | Meaning |
|---|---|---|
| `target` | `parent` | ScrollTrigger trigger element — normally the `pi-pin` section around it |
| `start` | `top top` | ScrollTrigger start position |
| `end` | `+=1000` | ScrollTrigger end position — match this to the surrounding pin |
| `dist` | `60` | px each child travels while entering/exiting |
| `ease` | `power1.inOut` | GSAP ease for each transition |
| `transition` | `0.25` | fraction (0–1) of each child's segment spent transitioning to the next; the rest of the segment the text sits still and readable |
| `scrub` | `true` | `true` = tied 1:1 to the scrollbar; a number = seconds of easing lag; `false` disables scrubbing |
| `disable` | `false` | skips the effect entirely, clears any inline styles |

The last child only ever **enters** — there's nothing after it to transition to, so it simply stays once visible until the pin itself ends.

```html
<section id="questions" pi-pin="end: +=2400" style="height:100vh; position:relative;">
  <h2 pi-animate="type: fade">Every section starts with a question.</h2>

  <div pi-stack="end: +=2400; dist: 50; transition: 0.3">
    <p>What problem are we solving?</p>
    <p>Who is it for?</p>
    <p>What should they do next?</p>
    <p>Let's talk — <a href="/contact">get in touch</a></p>
  </div>
</section>
```

The title above uses a normal one-shot `pi-animate` and stays completely outside `pi-stack` — it's unaffected by the cycling by construction, since it isn't one of the stacked children.

If the phrases are filled in by a client-side i18n layer after `init()` (same situation as `split`, see Notes & gotchas), `pi-stack` waits for every child to have text before measuring and building the stack, so the locked height isn't computed against empty paragraphs.

---

## `[pi-pin]` — pin a section on screen

Freezes the element in place for a scroll distance. Content inside typically uses `pi-scroll` **targeting the same element** with the **same `start`/`end`**, so both ScrollTriggers read progress from the same scroll distance.

| Param | Default | Meaning |
|---|---|---|
| `start` | `top top` | ScrollTrigger start position |
| `end` | `+=1000` | ScrollTrigger end position — `+=N` means "N px of scroll after start" |
| `scrub` | `true` | tie the pin's own progress to the scrollbar |
| `spacing` | `true` | reserves the pinned scroll distance in the document layout; `false` lets the next section overlap while pinned |
| `disable` | `false` | skips pinning entirely (useful under `mobile: { disable: true }`, since pinned sections are often disabled on small screens) |

```html
<section id="hero" pi-pin="end: +=1200" style="height:100vh; position:relative;">
  <h1 pi-animate="type: split; split: words; stagger: 0.06; dist: 80">
    Motion that follows the scroll.
  </h1>

  <!-- same distance as the pin, so it blurs out exactly as the pin ends -->
  <div
    pi-scroll="type: fade; fade: out; blur: 15; target: '#hero'; start: top top; end: +=1200; scrub: true"
  >
    <h1>Motion that follows the scroll.</h1>
  </div>
</section>
```

Disable pinning on mobile:
```html
<section pi-pin="end: +=1200; mobile: { disable: true }">
```

---

## `[pi-flow]` — fluid lag across a text

While the page scrolls, the characters of a text do not move rigidly: each one follows the scroll speed along a smooth curve, so one side seems to move first and the other catches up a moment later, as if the two sides were not perfectly in step. When the scroll stops everything settles back in place by itself, and at rest nothing is displaced.

```html
<h2 pi-flow="curve: s">Both sides move together, never quite in step.</h2>
```

How it behaves:

- **It reacts to scroll *speed*, not to position.** A slow scroll gives a slight lag, a quick flick a clear one, and a still page none. To judge it, scroll fast.
- **It follows whatever scrolls the page.** It reads the page's scroll position on every frame, so it works with native scrolling and with smooth-scroll libraries such as Lenis.
- **Vertical page scroll only (for now).** Texts carried sideways by a horizontal track are not supported yet.
- **Experimental.** It is new: try it on headings and short paragraphs first.

### Parameters

| Param | Default | Meaning |
|---|---|---|
| `curve` | `s` | Shape of the lag. `s`: the left side leads and the right side follows through a smooth S. `arc`: the two ends stay together and the middle trails behind. |
| `amount` | `0.35em` | Maximum displacement. A number is px (`amount: 20`); a number followed by `em` (`amount: 0.5em`) scales with the element's font size, so a large headline and a small paragraph both get a proportionate effect. This is the real maximum: the effect never goes beyond it. |
| `ref` | `500` | Scroll speed, in px/s, at which the effect reaches about 75% of `amount`. Lower it to see the effect at calmer scroll speeds. |
| `smooth` | `0.25` | Seconds the characters take to follow the scroll speed. Higher is softer and slower to settle. |
| `lag` | `1` | Extra delay along the curve: the further a character is along it, the later it follows and the later it settles. `0` makes every character follow at the same pace. |
| `split` | `chars` | `chars` \| `words`. Words are lighter on long texts and give a coarser curve. |
| `max` | `400` | Largest number of parts to animate. Above it the effect falls back to words, and if the words are still more than `max` it skips the element with a console warning. |
| `disable` | `false` | Skips the effect on this element. Mostly useful inside `mobile: { disable: true }`. |

### Getting a visible effect

- Raise `amount` first (try `0.6em` or `0.8em` on a large headline), then lower `ref` (try `300`) if it still looks timid at your usual scroll speed.
- `smooth` and `lag` change how long the catch-up lasts after you stop scrolling: raise both for a longer, more fluid tail.
- Choose `curve` last: `s` reads as one side leading the other, `arc` as the text bending in the middle.

### Combining and limits

- **With `pi-scroll="type: text-reveal"` on the same element** the two share one split and add up: the reveal changes opacity, the flow changes position.
- **The text must exist.** Like the split types, it waits for text that is filled in after `init()` (i18n, CMS).
- **Cost.** Only elements on screen are updated, and only while something is moving. Prefer headings and short paragraphs; long texts fall back to words and then to nothing because of `max`.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` the effect is skipped.
- **Safety brake.** If frames stay slow while the effect is working, it switches itself off until the page is reloaded and logs a warning. `PiMotion.flowStats().braked` tells whether that happened.
- **Mobile.** It accepts `mobile: { ... }` like every other attribute, for example `pi-flow="amount: 0.5em; mobile: { amount: 0.25em }"` or `mobile: { disable: true }`.

---

## Notes & gotchas

- **`fill: true` needs real headroom.** If the element and its container are the same size, the computed delta is `0` — no movement, by design (there's nothing to fill).
- **Flex/grid `align-items: stretch`** (the default) makes a column already as tall as its row. Put `pi-scroll="...; fill: true"` on an *inner* wrapper with natural height, not on the stretched column itself.
- **`scrub: true` vs a number.** `true` ties the effect 1:1 to the scrollbar — no lag, which matters most for `reverse: true` parallax (any lag makes a reversed motion look disconnected from the wheel). A number (e.g. `scrub: 0.5`) adds that many seconds of easing smoothing — opt in only if you want it.
- **`target`** accepts `parent`, or any CSS selector resolvable at setup time, optionally quoted (`'#hero'`/`"#hero"` — the quotes are stripped automatically). A selector that resolves to nothing, or one that is syntactically invalid, both log a `console.warn` and fall back to the default trigger — neither ever throws, and a bad selector on one element never stops the rest of the page from initializing.
- **Dynamic content needs a manual `PiMotion.refresh()`.** `invalidateOnRefresh` only recomputes fill-mode deltas and trigger positions when `ScrollTrigger.refresh()` runs, and that only happens automatically on a window resize. A layout change from an accordion opening, a tab switching, or AJAX-injected content needs an explicit `PiMotion.refresh()` call once it settles.
- **Web fonts + `split: lines`.** SplitText measures line breaks against the current layout. If a custom font swaps in after `init()` runs, previously-split lines can be wrong. Re-run `init(scope)` inside `document.fonts.ready` to fix this — `refresh()` alone does not re-split text.
- **`pi-stack` needs text too.** Same reasoning as the point below: if phrases are filled in by i18n after `init()`, the tallest-child height lock would be measured against empty elements. `pi-stack` waits for every direct child to have text first.
- **Split needs text to exist.** `type: split` (in both `pi-animate` and `pi-scroll`) can only split text that is already in the element. If the copy is filled in after `init()` (client-side i18n, a CMS/JS renderer), PiMotion waits: the element is watched and the split + animation are set up as soon as text appears, then triggers are refreshed. Text injected later would otherwise also overwrite the markup SplitText creates. If an element ends up with nothing to split (for example `split: lines` on a `display:none` element, which has no layout to measure), PiMotion logs `[PiMotion] "split: ..." found nothing to split` and skips it, instead of GSAP's generic "target not found". Changing the text of an element *after* it has been split is not supported — call `init()` again.
- **SplitText instances are tracked internally** and reverted automatically before re-splitting the same element (e.g. on a matchMedia breakpoint change, or a manual `init()` re-run) or on `PiMotion.destroy()` — you don't need to manage this yourself.
