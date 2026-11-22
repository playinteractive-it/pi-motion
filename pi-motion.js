import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * PI Motion - declarative scroll motion engine (GSAP + ScrollTrigger + SplitText)
 * Pure Vanilla ES6 - Isolated scope via gsap.matchMedia()
 *
 * Declarative attributes:
 *
 * [pi-animate] - one-shot reveal on enter
 *   "type: fade|slide-up|slide-down|slide-left|slide-right|split|scale;
 *    dist: <px>; dur: <s>; delay: <s>; ease: <string>;
 *    reverse: true|false; target: <selector>|parent (default: the element
 *    itself - see "reveals inside a pin" below); start: <ST position>;
 *    end: <ST position>;
 *    // split only: breaks the text into words (or lines) and animates
 *    // each one sliding in from `dist` px on the right, staggered.
 *    split: words|lines (default words); stagger: <s> (default 0.05);
 *    blur: <px> (optional - adds a blur-in matching the slide);
 *    disable: true|false; mobile: { ...overrides }"
 *
 * [pi-scroll] - continuous scroll-linked effect
 *   "type: parallax|fade|split|scale|text-reveal;
 *    // parallax: element starts at its natural position (0) and travels
 *    // `speed` px along `axis` by the time it finishes transiting from
 *    // `start` to `end`. `reverse` flips the direction of that travel.
 *    axis: x|y (default y); speed: <px> (default 100); reverse: true|false;
 *    // parallax fill mode: instead of a fixed `speed`, the element travels
 *    // exactly the size difference between it and its container on `axis`,
 *    // ending flush with the container's far edge. Works both ways: a
 *    // smaller element (e.g. a text column) travels down to meet the far
 *    // edge; a larger element (e.g. an oversized image inside an
 *    // overflow:hidden box) travels by its own overflow, panning inside
 *    // the box without ever exposing an edge. Target defaults to the
 *    // element's parent (there is nothing to fill relative to itself).
 *    // Recomputed on every ScrollTrigger refresh.
 *    fill: true|false;
 *    // fade:
 *    fade: in|out|in-out;
 *    // split: same word/line slide-in as pi-animate's split, but scrubbed
 *    // to the scrollbar instead of firing once.
 *    split: words|lines (default words); stagger: <s> (default 0.05);
 *    // shared:
 *    blur: <px> (optional - adds a blur transition to parallax/fade too);
 *    target: <selector>|parent (default: the element itself, or its parent
 *    when fill: true); start: <ST position>; end: <ST position>;
 *    scrub: true|false|<seconds>; disable: true|false;
 *    motion-safe: true|false (true = skip the effect when the OS asks for
 *    reduced motion; default false); mobile: { ...overrides }
 *    // scale (type: scale): `scale: in|out` (default in); `amount: <n>`
 *    // (default 1.2). in = from `amount` to 1; out = from 1 to `amount`.
 *    // `origin: <transform-origin>` optional (e.g. center, left center).
 *    // Same params on [pi-animate] (type: scale), which fires once.
 *    // horizontal scroll: the element rides on an ancestor that is itself
 *    // moved sideways by a parallax pi-scroll with axis: x (e.g. a track
 *    // inside a pinned section). `start`/`end` then read the element's
 *    // LEFT/RIGHT position in the viewport (defaults `left right` ->
 *    // `right left`) instead of top/bottom. `true` = the closest such
 *    // ancestor; a selector picks one explicitly (nested tracks).
 *    horizontal: true|<selector>
 *    // text-reveal (type: text-reveal): the text is split into characters
 *    // (or words/lines) that start at `opacity` and turn fully opaque one
 *    // after the other as the scroll advances, with no movement.
 *    // `split: chars|words|lines` (default chars); `opacity: <0-1>` (initial
 *    // opacity, default 0.08); `snap: true|false` (default true - each part
 *    // switches instantly; false = same order but fading linearly).
 *    // Default `start: top 75%`, `end: bottom 45%` (left right / right left
 *    // with `horizontal`)."
 *
 * [pi-stack] - cycles through its direct children one at a time, scrubbed
 *   to scroll (e.g. a sequence of questions under a pinned title). Every
 *   child is stacked in the same box and the container is locked to the
 *   tallest child, so content above never jumps when the visible child
 *   changes. `end - start` is split into one equal segment per
 *   transition; needs at least 2 children.
 *   "target: <selector>|parent (default: parent);
 *    start: <ST position> (default top top);
 *    end: <ST position> (default +=1000) - match this to the pi-pin it
 *    lives inside, same principle as syncing pi-scroll to a pin;
 *    dist: <px> (default 60) - travel distance of the slide;
 *    ease: <string> (default power1.inOut);
 *    transition: <0-1> (default 0.25) - fraction of each child's segment
 *    spent transitioning to the next one, rest spent static/readable;
 *    scrub: true|false|<seconds> (default true);
 *    disable: true|false; mobile: { ...overrides }"
 *
 * [pi-pin] - pins a section on screen for a scroll distance
 *   "start: <ST position> (default top top);
 *    end: <ST position, e.g. +=1200> (default +=1000);
 *    scrub: true|false|<seconds> (default true);
 *    spacing: true|false (default true - reserves the scrolled distance in
 *    the document; false lets the next section overlap while pinned);
 *    disable: true|false; mobile: { ...overrides }"
 *
 *   To sync a pi-scroll or pi-animate effect with a pin (e.g. the
 *   blur-exit of a pinned title, or a reveal that should play once the
 *   pin engages rather than before it), point the child's `target` at the
 *   pinned element's selector and give it the same `start`/`end` values
 *   as the pin - every ScrollTrigger involved then reads progress from
 *   the same scroll distance. Without this, a pi-animate on an element
 *   that ends up pinned uses default start/end measured against its own
 *   (now frozen) position, which describes a moment before the pin ever
 *   engages - the reveal can look already finished by the time the
 *   section locks into view, or vanish for good with `reverse: true`.
 *
 * [pi-flow] - fluid lag across a text while the page scrolls (experimental).
 *   The text is split into characters and each one follows the scroll
 *   velocity along a smooth curve, so the left side seems to move first
 *   and the right side catches up. Everything settles back by itself when
 *   the scroll stops. Works for a vertical page scroll (default) and for a
 *   text carried sideways by a horizontal track (axis: x).
 *   "axis: y|x (default y) - y: the page scrolls vertically, the curve runs left
 *    to right and the parts move up and down; x: the text is carried sideways,
 *    the curve runs top to bottom and the parts move left and right (it needs
 *    several lines to show a curve);
 *    curve: s|arc (default s) - s: left leads, right follows through a
 *    smooth S; arc: both ends stay together, the middle trails;
 *    amount: <px>|<n>em (default 0.35em, 0.5em with axis: x) - maximum displacement; em scales
 *    with the element's font size (a number is px);
 *    smooth: <s> (default 0.25) - how quickly it follows the scroll speed;
 *    lag: <n> (default 1) - extra delay of the right side (0 = none);
 *    ref: <px/s> (default 500, 250 with axis: x) - scroll speed at which the effect reaches
 *    about 75% of the amount (it saturates, so `amount` is the true maximum);
 *    split: chars|words (default chars); max: <n> (default 400) - above this
 *    many parts the effect falls back to words, then skips itself;
 *    disable: true|false; mobile: { ...overrides }"
 *   Safety: it only runs while the element is on screen and the page is
 *   moving, it is skipped under prefers-reduced-motion, and it switches
 *   itself off for good if the frame rate drops.
 *
 * PiMotion.refresh() - recomputes all ScrollTrigger positions and
 *   fill-mode parallax deltas. Call it after a layout change ScrollTrigger
 *   can't detect on its own (lazy-loaded images, accordions/tabs, content
 *   injected via AJAX). It does not re-run SplitText.
 *
 * PiMotion.flowStats() - diagnostic for [pi-flow]: { braked, ticker, frameAvgMs,
 *   runners }. Handy in the browser console to see what each flow is doing. *
 * Web fonts + `split: lines`: SplitText measures line breaks against the
 *   layout at the moment it runs. If custom fonts swap in after `init()`
 *   (FOUT/FOIT), lines split before the swap can be wrong. Re-run
 *   `init(scope)` (not just `refresh()`) inside `document.fonts.ready` to
 *   re-measure - `init()` already reverts and re-splits safely.
 */
export const PiMotion = (() => {
  let mm = null;
  // Tracks live SplitText instances per element so a re-init (or a
  // matchMedia breakpoint change re-running the same element) reverts the
  // previous split before creating a new one, instead of splitting
  // already-split markup.
  const splitRegistry = new Map();
  // Horizontal (axis: x) parallax tweens by element, so a pi-scroll with
  // `horizontal` can find the tween that moves its ancestor (ScrollTrigger's
  // `containerAnimation`). Cleared on destroy().
  const containerRegistry = new Map();

  const MOBILE_BREAKPOINT = '(max-width: 768px)';
  const DESKTOP_BREAKPOINT = '(min-width: 769px)';

  /**
   * Fast tokenizer for declarative CSS-like string syntax:
   * "type: slide-up; dist: 50; mobile: { dist: 20; disable: true }"
   */
  const parseConfig = (str) => {
    if (!str) return {};
    const config = {};
    let sanitized = str.trim();

    // Extract mobile block if present
    const mobileMatch = sanitized.match(/mobile\s*:\s*\{([^}]+)\}/);
    if (mobileMatch) {
      config.mobile = parseConfig(mobileMatch[1]);
      sanitized = sanitized.replace(/mobile\s*:\s*\{([^}]+)\}/, '').trim();
    }

    // Parse root key-value pairs
    const pairs = sanitized.split(';').map((p) => p.trim()).filter(Boolean);
    pairs.forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx !== -1) {
        const key = pair.slice(0, idx).trim();
        let val = pair.slice(idx + 1).trim();

        // Strip a single matching pair of quotes (e.g. target: '#hero' or
        // target: "#hero") before any further parsing. Selectors are the
        // main case, but this applies to any quoted value.
        if (val.length >= 2) {
          const first = val[0];
          const last = val[val.length - 1];
          if ((first === "'" || first === '"') && first === last) {
            val = val.slice(1, -1).trim();
          }
        }

        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val !== '' && !isNaN(Number(val))) val = Number(val);

        config[key] = val;
      }
    });

    return config;
  };

  /**
   * Resolves a ScrollTrigger trigger element: an explicit selector or
   * "parent", falling back to `fallback` when none is given, the selector
   * isn't found, or it's malformed. Shared by createScrollEffect and
   * createStack. A malformed selector throws a SyntaxError from
   * querySelector - this must never bubble up, or it aborts the rest of
   * the current breakpoint's forEach loop (every element after this one
   * would be silently skipped). No implicit ancestor-class lookups.
   */
  const resolveTrigger = (el, cfg, fallback) => {
    if (!cfg.target) return fallback;
    if (cfg.target === 'parent') return el.parentElement || fallback;

    let found = null;
    try {
      found = document.querySelector(cfg.target);
    } catch (err) {
      console.warn(`[PiMotion] target "${cfg.target}" is not a valid selector. Falling back to the default trigger.`, el);
      return fallback;
    }

    if (!found) {
      console.warn(`[PiMotion] target "${cfg.target}" not found. Falling back to the default trigger.`, el);
      return fallback;
    }
    return found;
  };

  /**
   * Resolves `horizontal: true | <selector>` to the tween that moves an
   * ancestor of `el` sideways (registered by that ancestor's own pi-scroll
   * with `axis: x`). `true` takes the closest such ancestor; a selector
   * takes the closest ancestor matching it. Returns null when `horizontal`
   * is not set. When it is set but nothing usable is found (invalid
   * selector, no ancestor moved by an axis: x parallax - e.g. disabled on
   * mobile), it logs a console.warn and returns null, so the caller falls
   * back to the normal vertical trigger instead of breaking.
   */
  const resolveContainerAnimation = (el, cfg) => {
    if (!cfg.horizontal) return null;

    let tween = null;
    if (cfg.horizontal === true) {
      for (let node = el.parentElement; node && !tween; node = node.parentElement) {
        tween = containerRegistry.get(node) || null;
      }
    } else {
      try {
        const node = el.parentElement ? el.parentElement.closest(cfg.horizontal) : null;
        tween = node ? containerRegistry.get(node) || null : null;
      } catch (err) {
        console.warn(`[PiMotion] horizontal "${cfg.horizontal}" is not a valid selector. Falling back to the vertical trigger.`, el);
        return null;
      }
    }

    if (!tween) {
      console.warn('[PiMotion] horizontal: no ancestor moved by a pi-scroll with axis: x was found. Falling back to the vertical trigger.', el);
      return null;
    }
    return tween;
  };

  const getDirectionOffsets = (direction, distance) => {
    switch (direction) {
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  /**
   * Builds the from/to vars of `type: scale` (shared by pi-animate and
   * pi-scroll). `scale: in` goes from `amount` to 1; `scale: out` goes from 1
   * to `amount`. `origin` (optional) is a CSS transform-origin. Returns null
   * (with a console.warn) when `amount` is not a number > 0.
   */
  const getScaleVars = (el, cfg) => {
    const amount = typeof cfg.amount !== 'undefined' ? cfg.amount : 1.2;
    if (typeof amount !== 'number' || !(amount > 0)) {
      console.warn('[PiMotion] scale: "amount" must be a number > 0. Skipping.', el);
      return null;
    }
    const isOut = cfg.scale === 'out';
    const from = { scale: isOut ? 1 : amount };
    const to = { scale: isOut ? amount : 1 };
    if (typeof cfg.origin === 'string' && cfg.origin !== '') {
      from.transformOrigin = cfg.origin;
      to.transformOrigin = cfg.origin;
    }
    return { from, to };
  };

  /**
   * Splits `el` into words or lines (reverting any previous split on the
   * same element first) and returns the parts plus the from/to variable
   * objects to animate them with. Shared by createReveal and
   * createScrollEffect so both "type: split" branches stay identical.
   */
  const createSplitParts = (el, cfg) => {
    if (splitRegistry.has(el)) {
      splitRegistry.get(el).revert();
      splitRegistry.delete(el);
    }

    const splitType = cfg.split === 'lines' ? 'lines' : 'words';
    const split = new SplitText(el, { type: splitType });
    const parts = splitType === 'lines' ? split.lines : split.words;

    // Nothing to animate (no text, or `lines` measured on an element with
    // no layout, e.g. display:none). Passing an empty array to gsap.set
    // would only produce the cryptic "GSAP target not found" warning, so
    // undo the split and tell the caller to skip.
    if (!parts || parts.length === 0) {
      split.revert();
      console.warn(`[PiMotion] "split: ${splitType}" found nothing to split on this element (no text yet, or hidden / no layout for lines). Skipping.`, el);
      return null;
    }
    splitRegistry.set(el, split);

    const distance = typeof cfg.dist !== 'undefined' ? cfg.dist : 60;
    const fromVars = { x: distance, opacity: 0 };
    const toVars = { x: 0, opacity: 1 };

    if (typeof cfg.blur === 'number') {
      fromVars.filter = `blur(${cfg.blur}px)`;
      toVars.filter = 'blur(0px)';
    }

    gsap.set(parts, fromVars);

    return { parts, fromVars, toVars };
  };

  /**
   * Runs `run` now if `el` already has text, otherwise waits for text to
   * appear (typical when a client-side i18n layer fills the copy in after
   * PiMotion.init()). A split on an empty element has nothing to split, and
   * text injected later would also overwrite any markup SplitText created,
   * so splitting must always happen after the text is in place.
   * `env.ctx.add` keeps the deferred triggers/tweens inside the same
   * matchMedia context, so they are still reverted on breakpoint change or
   * destroy(); `env.pending` lets that cleanup disconnect the observers.
   */
  const runWhenTextReady = (el, env, run) => {
    if (el.textContent.trim() !== '') {
      run();
      return;
    }

    const observer = new MutationObserver(() => {
      if (el.textContent.trim() === '') return;
      observer.disconnect();
      env.pending.delete(observer);
      env.ctx.add(run);
      ScrollTrigger.refresh();
    });
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    env.pending.add(observer);
  };

  /**
   * Same idea as runWhenTextReady, but for pi-stack: waits until every
   * direct child already has text before measuring/building the stack.
   * Needed for the same reason - a client-side i18n layer filling the
   * phrases in after init() would otherwise get measured as empty, giving
   * the container the wrong locked height.
   */
  const runWhenChildrenTextReady = (el, children, env, run) => {
    const ready = () => children.every((child) => child.textContent.trim() !== '');

    if (ready()) {
      run();
      return;
    }

    const observer = new MutationObserver(() => {
      if (!ready()) return;
      observer.disconnect();
      env.pending.delete(observer);
      env.ctx.add(run);
      ScrollTrigger.refresh();
    });
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    env.pending.add(observer);
  };

  /**
   * 1. Reveal Animations Handler
   */
  const createReveal = (el, cfg, env) => {
    if (cfg.disable === true) {
      if (splitRegistry.has(el)) {
        splitRegistry.get(el).revert();
        splitRegistry.delete(el);
      }
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    const type = cfg.type || 'fade';

    // Split: words/lines slide in from the right, staggered, firing once
    // on enter - independent from the fade/slide logic below, which is
    // untouched.
    if (type === 'split') {
      runWhenTextReady(el, env, () => {
        const created = createSplitParts(el, cfg);
        if (!created) return;
        const { parts, fromVars, toVars } = created;
        const duration = typeof cfg.dur !== 'undefined' ? cfg.dur : 0.8;
        const stagger = typeof cfg.stagger !== 'undefined' ? cfg.stagger : 0.05;
        const ease = cfg.ease || 'power3.out';
        const isReverse = cfg.reverse === true;

        const animateIn = () => gsap.to(parts, { ...toVars, duration, stagger, ease, overwrite: true });
        const animateOut = () => gsap.to(parts, { ...fromVars, duration: duration * 0.6, stagger, ease: 'power2.in', overwrite: true });

        ScrollTrigger.create({
          trigger: resolveTrigger(el, cfg, el),
          start: cfg.start || 'top 88%',
          end: cfg.end || 'bottom 12%',
          onEnter: animateIn,
          onEnterBack: () => isReverse && animateIn(),
          onLeave: () => isReverse && animateOut(),
          onLeaveBack: () => isReverse && animateOut()
        });
      });
      return;
    }

    // Scale: only scales (no opacity change), firing once on enter.
    // `scale: in` = from `amount` to 1; `scale: out` = from 1 to `amount`.
    if (type === 'scale') {
      const vars = getScaleVars(el, cfg);
      if (!vars) return;
      const scaleDuration = typeof cfg.dur !== 'undefined' ? cfg.dur : 0.8;
      const scaleDelay = typeof cfg.delay !== 'undefined' ? cfg.delay : 0;
      const scaleEase = cfg.ease || 'power2.out';
      const scaleReverse = cfg.reverse === true;

      gsap.set(el, { ...vars.from, willChange: 'transform' });

      const scaleIn = () => gsap.to(el, {
        ...vars.to,
        duration: scaleDuration,
        delay: scaleDelay,
        ease: scaleEase,
        overwrite: 'auto',
        onComplete: () => gsap.set(el, { clearProps: 'willChange' })
      });
      const scaleReset = () => gsap.to(el, {
        ...vars.from,
        duration: scaleDuration * 0.7,
        ease: 'power2.in',
        overwrite: 'auto'
      });

      ScrollTrigger.create({
        trigger: resolveTrigger(el, cfg, el),
        start: cfg.start || 'top 88%',
        end: cfg.end || 'bottom 12%',
        onEnter: scaleIn,
        onEnterBack: () => scaleReverse && scaleIn(),
        onLeave: () => scaleReverse && scaleReset(),
        onLeaveBack: () => scaleReverse && scaleReset()
      });
      return;
    }

    const duration = typeof cfg.dur !== 'undefined' ? cfg.dur : 0.8;
    const delay = typeof cfg.delay !== 'undefined' ? cfg.delay : 0;
    const distance = typeof cfg.dist !== 'undefined' ? cfg.dist : 40;
    const ease = cfg.ease || 'power2.out';
    const isReverse = cfg.reverse === true;

    const fromProps = { opacity: 0 };
    const toProps = {
      opacity: 1,
      x: 0,
      y: 0,
      duration,
      delay,
      ease,
      overwrite: 'auto',
      onComplete: () => gsap.set(el, { clearProps: 'willChange' })
    };

    if (type.startsWith('slide-')) {
      const dir = type.replace('slide-', '');
      const offsets = getDirectionOffsets(dir, distance);
      fromProps.x = offsets.x;
      fromProps.y = offsets.y;
    }

    // Set initial (hidden) state
    gsap.set(el, { ...fromProps, willChange: 'transform, opacity' });

    // Shared "return to hidden state" tween, used by both leave callbacks
    // when the reveal is configured to be reversible.
    const resetToHidden = () => {
      gsap.to(el, {
        ...fromProps,
        duration: duration * 0.7,
        ease: 'power2.in',
        overwrite: 'auto'
      });
    };

    ScrollTrigger.create({
      trigger: resolveTrigger(el, cfg, el),
      start: cfg.start || 'top 88%',
      end: cfg.end || 'bottom 12%',
      onEnter: () => gsap.to(el, toProps),
      onEnterBack: () => isReverse && gsap.to(el, toProps),
      onLeave: () => isReverse && resetToHidden(),
      onLeaveBack: () => isReverse && resetToHidden()
    });
  };

  /**
   * 2. Continuous Scroll Effects Handler (Parallax / Fade / Split)
   *
   * Parallax has two modes:
   * - fixed speed: the element starts at its natural position (0) and
   *   travels `speed` pixels along `axis` by the time it finishes
   *   transiting from `start` to `end`. Anchoring at 0 (rather than a
   *   centered -speed/2..+speed/2) matters: the element sits exactly
   *   where it was authored in CSS at rest, before entering its scroll
   *   window - nothing jumps on page load just because `speed` is large.
   * - fill (`fill: true`): the element travels exactly the extra space
   *   its container has on `axis` beyond the element's own size, so it
   *   always ends up flush with the container's far edge - no speed
   *   value to guess, it adapts to the real, current layout.
   * In both modes `reverse: true` flips the direction of the travel -
   * there is no separate "mode" param to reason about beyond `fill`.
   *
   * `blur: <px>` is an optional add-on for parallax and fade: it tweens
   * `filter: blur()` from 0 to the given value alongside whatever else
   * the type already does.
   */
  const createScrollEffect = (el, cfg, env) => {
    if (cfg.disable === true) {
      if (splitRegistry.has(el)) {
        splitRegistry.get(el).revert();
        splitRegistry.delete(el);
      }
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    // Opt-in (`motion-safe: true`): leave the element still for visitors
    // who asked the OS to reduce motion.
    if (cfg['motion-safe'] === true && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { clearProps: 'all' });
      return;
    }

    const type = cfg.type || 'parallax';
    // scrub defaults to `true` (tied 1:1 to the scrollbar, zero lag).
    // A numeric value (seconds of easing) can be requested explicitly,
    // but it's opt-in: lag is exactly what makes a reversed effect feel
    // disconnected from the mouse wheel, so it's never imposed by default.
    const scrub = typeof cfg.scrub !== 'undefined' ? cfg.scrub : true;
    // Same default window for every type here: "while the trigger is
    // transiting the viewport, bottom to top". `top top` / `bottom
    // bottom` was tried for fill mode and rejected - it inverts into a
    // negative scroll range whenever the container is shorter than the
    // viewport, which is the common case for a content row.
    // With `horizontal`, positions are horizontal (left/right of the viewport)
    // and ScrollTrigger needs the container's tween as `containerAnimation`.
    const containerAnimation = resolveContainerAnimation(el, cfg);
    const isTextReveal = type === 'text-reveal';
    const start = cfg.start || (containerAnimation ? 'left right' : (isTextReveal ? 'top 75%' : 'top bottom'));
    const end = cfg.end || (containerAnimation ? 'right left' : (isTextReveal ? 'bottom 45%' : 'bottom top'));
    const scrollTriggerVars = (trigger) => {
      const vars = { trigger, start, end, scrub, invalidateOnRefresh: true };
      if (containerAnimation) vars.containerAnimation = containerAnimation;
      return vars;
    };
    const blur = typeof cfg.blur === 'number' ? cfg.blur : null;

    if (type === 'split') {
      const triggerElement = resolveTrigger(el, cfg, el);
      const stagger = typeof cfg.stagger !== 'undefined' ? cfg.stagger : 0.05;

      runWhenTextReady(el, env, () => {
        const created = createSplitParts(el, cfg);
        if (!created) return;

        gsap.to(created.parts, {
          ...created.toVars,
          stagger,
          ease: 'none',
          scrollTrigger: scrollTriggerVars(triggerElement)
        });
      });
      return;
    }

    // Text reveal: the split parts (characters by default) keep a low initial
    // opacity and become opaque one by one, scrubbed to the scroll. No
    // movement. Waits for the text like the other split types.
    if (type === 'text-reveal') {
      const triggerElement = resolveTrigger(el, cfg, el);
      const splitMode = cfg.split === 'words' || cfg.split === 'lines' ? cfg.split : 'chars';
      const startOpacity = typeof cfg.opacity === 'number' && cfg.opacity >= 0 && cfg.opacity <= 1 ? cfg.opacity : 0.08;
      const snap = cfg.snap !== false;

      runWhenTextReady(el, env, () => {
        if (splitRegistry.has(el)) {
          splitRegistry.get(el).revert();
          splitRegistry.delete(el);
        }

        // `tag: 'span'`: plain inline spans like a hand-made split (SplitText's
        // default is `div` + position:relative); the display is set below.
        const split = new SplitText(el, { type: splitMode === 'chars' ? 'words,chars' : splitMode, tag: 'span' });
        const parts = split[splitMode];
        if (!parts || parts.length === 0) {
          split.revert();
          console.warn(`[PiMotion] "text-reveal" found nothing to split on this element (no text yet, or hidden / no layout for lines). Skipping.`, el);
          return;
        }
        splitRegistry.set(el, split);

        // Words never break across lines, as the characters inside are
        // separate boxes.
        if (splitMode === 'chars') gsap.set(split.words, { display: 'inline-block', whiteSpace: 'nowrap' });
        gsap.set(parts, { display: splitMode === 'lines' ? 'block' : 'inline-block', opacity: startOpacity, willChange: 'opacity' });

        // Fixed timing, like the tween it replaces: every part takes the
        // same slice of the scroll range, in reading order.
        gsap.to(parts, {
          opacity: 1,
          duration: 0.1,
          ease: snap ? 'steps(1)' : 'none',
          stagger: { each: 0.1, ease: 'none' },
          scrollTrigger: { ...scrollTriggerVars(triggerElement), refreshPriority: -1 }
        });
      });
      return;
    }

    if (type === 'scale') {
      const vars = getScaleVars(el, cfg);
      if (!vars) return;
      gsap.set(el, { willChange: 'transform' });
      gsap.fromTo(el, vars.from, {
        ...vars.to,
        ease: 'none',
        scrollTrigger: scrollTriggerVars(resolveTrigger(el, cfg, el))
      });
      return;
    }

    if (type === 'parallax') {
      const axis = cfg.axis === 'x' ? 'x' : 'y';
      const isFill = cfg.fill === true;

      // Fill mode targets the element's own container by default (there
      // is nothing to fill relative to itself); fixed-speed parallax
      // targets the element itself by default.
      const triggerElement = resolveTrigger(el, cfg, isFill ? (el.parentElement || el) : el);

      gsap.set(el, { willChange: 'transform' });

      const fromVars = { [axis]: 0 };
      const toVars = { ease: 'none', scrollTrigger: scrollTriggerVars(triggerElement) };
      if (blur !== null) {
        fromVars.filter = 'blur(0px)';
        toVars.filter = `blur(${blur}px)`;
      }

      if (isFill) {
        const dimension = axis === 'y' ? 'height' : 'width';
        // Signed on purpose: positive when the element is smaller than its
        // container (it travels down/right to end flush with the far
        // edge - the two-column case); negative when the element is
        // larger (it travels up/left by its own overflow - an image
        // taller than its cropping box, panning inside it without ever
        // exposing an edge).
        const getDelta = () => {
          const containerSize = triggerElement.getBoundingClientRect()[dimension];
          const elSize = el.getBoundingClientRect()[dimension];
          return containerSize - elSize;
        };
        toVars[axis] = () => (cfg.reverse === true ? -getDelta() : getDelta());
      } else {
        const speed = typeof cfg.speed === 'number' ? cfg.speed : 100;
        toVars[axis] = cfg.reverse === true ? -speed : speed;
      }

      const tween = gsap.fromTo(el, fromVars, toVars);
      if (axis === 'x') containerRegistry.set(el, tween);
    } else if (type === 'fade') {
      const triggerElement = resolveTrigger(el, cfg, el);
      const fadeMode = cfg.fade || 'in-out';
      gsap.set(el, { willChange: 'opacity' });

      if (fadeMode === 'in-out') {
        const tl = gsap.timeline({
          scrollTrigger: scrollTriggerVars(triggerElement)
        });

        // Blur (when set) mirrors the opacity curve segment-by-segment:
        // blurred -> sharp while fading in, sharp through the hold, sharp
        // -> blurred while fading out. It is NOT a single tween spanning
        // the whole timeline - that would keep blurring the element
        // through the hold phase even though opacity stays at 1 there.
        const fromIn = { opacity: 0 };
        const toIn = { opacity: 1, ease: 'none', duration: 0.3 };
        const toOut = { opacity: 0, ease: 'none', duration: 0.3 };
        if (blur !== null) {
          fromIn.filter = `blur(${blur}px)`;
          toIn.filter = 'blur(0px)';
          toOut.filter = `blur(${blur}px)`;
        }

        tl.fromTo(el, fromIn, toIn)
          .to(el, { opacity: 1, ease: 'none', duration: 0.4 })
          .to(el, toOut);
      } else {
        const isFadeIn = fadeMode === 'in';
        const fromVars = { opacity: isFadeIn ? 0 : 1 };
        const toVars = {
          opacity: isFadeIn ? 1 : 0,
          ease: 'none',
          scrollTrigger: scrollTriggerVars(triggerElement)
        };
        if (blur !== null) {
          fromVars.filter = 'blur(0px)';
          toVars.filter = `blur(${blur}px)`;
        }
        gsap.fromTo(el, fromVars, toVars);
      }
    } else {
      console.warn(`[PiMotion] Unknown pi-scroll type "${type}".`, el);
    }
  };

  /**
   * 3. Stack - cycles through an element's direct children one at a time,
   * scrubbed to scroll: each one slides/fades out while the next slides/
   * fades in, over `end - start` split into one equal segment per
   * transition. Every child is stacked on top of the others (absolute,
   * same box) and the container is locked to the tallest child's height,
   * so content above (e.g. a pinned title) never jumps when the visible
   * child changes. Meant to live inside a pi-pin section, with the same
   * start/end as the pin - see the file-level doc comment.
   */
  const createStack = (el, cfg, env) => {
    const children = Array.from(el.children);

    if (cfg.disable === true) {
      gsap.set(el, { clearProps: 'all' });
      if (children.length) gsap.set(children, { clearProps: 'all' });
      return;
    }

    if (children.length < 2) {
      console.warn('[PiMotion] pi-stack needs at least 2 direct children to alternate between. Skipping.', el);
      return;
    }

    runWhenChildrenTextReady(el, children, env, () => {
      const triggerElement = resolveTrigger(el, cfg, el.parentElement || el);
      const start = cfg.start || 'top top';
      const end = cfg.end || '+=1000';
      const scrub = typeof cfg.scrub !== 'undefined' ? cfg.scrub : true;
      const dist = typeof cfg.dist !== 'undefined' ? cfg.dist : 60;
      const ease = cfg.ease || 'power1.inOut';
      // Fraction of each child's on-screen segment spent transitioning to
      // the next one; the rest of the segment the text just sits still
      // and readable.
      const transitionFraction = typeof cfg.transition !== 'undefined' ? cfg.transition : 0.25;

      gsap.set(el, { position: 'relative' });
      gsap.set(children, { position: 'absolute', top: 0, left: 0, width: '100%' });

      // Locks the container to the tallest child so the title above it
      // never jumps as children swap in and out. Re-measured on every
      // ScrollTrigger refresh (e.g. a resize), since children stacked
      // with position:absolute no longer contribute to the container's
      // own natural height.
      const remeasure = () => {
        const tallest = Math.max(...children.map((child) => child.getBoundingClientRect().height));
        gsap.set(el, { height: tallest });
      };
      remeasure();

      gsap.set(children[0], { opacity: 1, y: 0 });
      gsap.set(children.slice(1), { opacity: 0, y: dist });

      // One unit of (arbitrary) timeline duration per transition - GSAP's
      // scrub maps the full start->end scroll range to the timeline's
      // total duration regardless of what that total is, so every
      // transition ends up an equal-size slice of the scroll range
      // without needing to hardcode that total anywhere.
      const segmentDuration = 1.5;
      const transitionDuration = segmentDuration * transitionFraction;
      const holdDuration = segmentDuration - transitionDuration;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: triggerElement, start, end, scrub, invalidateOnRefresh: true, onRefreshInit: remeasure }
      });

      children.forEach((child, i) => {
        if (i === children.length - 1) return; // last child only enters, never exits
        const next = children[i + 1];
        tl.to({}, { duration: holdDuration }) // `child` stays fully visible
          .to(child, { opacity: 0, y: -dist, ease, duration: transitionDuration }) // sequential: starts right after the hold
          .to(next, { opacity: 1, y: 0, ease, duration: transitionDuration }, '<'); // '<' = same start time as the exit above
      });

      // Give the last child (typically a closing CTA) the same dedicated
      // on-screen segment every other child got, instead of appearing
      // right as the scroll range ends with no time to read or click it.
      // Pure hold, no properties - just consumes its share of the scroll
      // distance. This also means scrolling back from just past the end
      // lands on the last child still fully visible, not already gone.
      tl.to({}, { duration: segmentDuration });
    });
  };

  /**
   * 4. Pin - freezes a section on screen for a scroll distance. Content
   * inside typically uses pi-scroll targeting this same element (see the
   * file-level doc comment) to stay in sync with the pinned distance.
   */
  const createPin = (el, cfg) => {
    if (cfg.disable === true) return;

    ScrollTrigger.create({
      trigger: el,
      start: cfg.start || 'top top',
      end: cfg.end || '+=1000',
      scrub: typeof cfg.scrub !== 'undefined' ? cfg.scrub : true,
      pin: true,
      pinSpacing: cfg.spacing !== false,
      invalidateOnRefresh: true
    });
  };

  /**
   * 5. Flow - velocity-driven lag across a text (see the file-level doc).
   * One shared ticker measures the scroll velocity and feeds every running
   * flow; each flow only does work while its element is on screen and
   * something is still moving.
   */
  const FLOW_MAX_FRAME_MS = 45;
  const flowRunners = new Set();
  let flowTickerOn = false;
  let flowLastY = 0;
  let flowLastTime = 0;
  let flowFrameAvg = 16.7;
  let flowBusyFrames = 0;
  let flowBraked = false;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const smoothstep = (n) => n * n * (3 - 2 * n);

  const flowTick = () => {
    const now = performance.now();
    const dt = clamp(now - flowLastTime, 1, 100);
    flowLastTime = now;
    const y = window.scrollY;
    const velocity = ((y - flowLastY) / dt) * 1000; // px/s, positive = scrolling down
    flowLastY = y;

    // Reads first, writes after, so several flows never force the layout twice.
    flowRunners.forEach((runner) => { if (runner.read) runner.read(dt); });

    let busy = false;
    flowRunners.forEach((runner) => {
      if (runner.update(velocity, dt)) busy = true;
    });

    if (!busy) {
      flowBusyFrames = 0;
      flowFrameAvg = 16.7;
      return;
    }

    // Safety brake: if the frames get slow while flows are working, switch
    // them all off until the page is reloaded rather than make it worse.
    flowBusyFrames += 1;
    flowFrameAvg += (dt - flowFrameAvg) * 0.1;
    if (flowBusyFrames > 60 && flowFrameAvg > FLOW_MAX_FRAME_MS) {
      flowBraked = true;
      console.warn('[PiMotion] pi-flow switched itself off: the page is running too slowly.');
      flowRunners.forEach((runner) => runner.stop());
    }
  };

  const startFlowTicker = () => {
    if (flowTickerOn) return;
    flowTickerOn = true;
    flowLastY = window.scrollY;
    flowLastTime = performance.now();
    gsap.ticker.add(flowTick);
  };

  const stopFlowTickerIfIdle = () => {
    if (flowRunners.size > 0 || !flowTickerOn) return;
    flowTickerOn = false;
    gsap.ticker.remove(flowTick);
  };

  const createFlow = (el, cfg, env) => {
    if (cfg.disable === true || flowBraked) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const curve = cfg.curve === 'arc' ? 'arc' : 's';
    // axis: y (default) = the page scrolls vertically, the curve runs left to right
    // and the parts move up and down. axis: x = the text is carried sideways (a
    // horizontal track), the curve runs top to bottom and the parts move left and right.
    const horizontal = cfg.axis === 'x';
    const smooth = typeof cfg.smooth === 'number' && cfg.smooth > 0 ? cfg.smooth : 0.25;
    const lag = typeof cfg.lag === 'number' && cfg.lag >= 0 ? cfg.lag : 1;
    // A sideways track usually moves slower than the scroll that drives it, so its
    // defaults are a little stronger: the same scroll gives it less speed to react to.
    const ref = typeof cfg.ref === 'number' && cfg.ref > 0 ? cfg.ref : (horizontal ? 250 : 500);
    // `amount` is px (a number) or em (a string such as "0.4em", scaled by the
    // element's font size, so a big headline and a small paragraph both get
    // a displacement that looks proportionate).
    const readAmount = () => {
      if (typeof cfg.amount === 'number') return cfg.amount;
      const em = typeof cfg.amount === 'string' && /^-?\d*\.?\d+em$/.test(cfg.amount) ? parseFloat(cfg.amount) : (horizontal ? 0.5 : 0.35);
      return em * (parseFloat(getComputedStyle(el).fontSize) || 16);
    };
    const maxParts = typeof cfg.max === 'number' && cfg.max > 0 ? cfg.max : 400;
    const wantWords = cfg.split === 'words';

    runWhenTextReady(el, env, () => {
      // Reuse a split another effect already made on this element (e.g.
      // text-reveal), otherwise make our own.
      let split = splitRegistry.get(el);
      let ownSplit = false;
      if (!split) {
        split = new SplitText(el, { type: 'words,chars', tag: 'span' });
        splitRegistry.set(el, split);
        ownSplit = true;
      }

      let parts = wantWords ? split.words : split.chars;
      if (!parts || parts.length === 0 || parts.length > maxParts) parts = split.words;
      if (!parts || parts.length === 0 || parts.length > maxParts) {
        if (ownSplit) {
          split.revert();
          splitRegistry.delete(el);
        }
        console.warn(`[PiMotion] pi-flow skipped: the text has more than ${maxParts} parts. Raise "max" or shorten the text.`, el);
        return;
      }

      if (ownSplit) {
        gsap.set(split.words, { display: 'inline-block', whiteSpace: 'nowrap' });
        if (parts === split.chars) gsap.set(parts, { display: 'inline-block' });
      }

      const count = parts.length;
      const setMove = parts.map((part) => gsap.quickSetter(part, horizontal ? 'x' : 'y', 'px'));
      const state = new Float32Array(count);
      const weight = new Float32Array(count); // position along the curve, 0..1
      let amountPx = readAmount();
      let moving = false;
      let inView = false;

      // Where every part sits along the curve: its position across the element,
      // 0 to 1 (left to right for a vertical scroll, top to bottom for a sideways
      // one), shaped by the curve: `s` eases from 0 to 1, `arc` rises to 1 in the
      // middle and returns to 0.
      const measure = () => {
        amountPx = readAmount();
        const box = el.getBoundingClientRect();
        const size = (horizontal ? box.height : box.width) || 1;
        for (let i = 0; i < count; i += 1) {
          const r = parts[i].getBoundingClientRect();
          const n = clamp(horizontal
            ? (r.top + r.height / 2 - box.top) / size
            : (r.left + r.width / 2 - box.left) / size, 0, 1);
          weight[i] = curve === 'arc' ? Math.sin(Math.PI * n) : smoothstep(n);
        }
      };

      const reset = () => {
        for (let i = 0; i < count; i += 1) setMove[i](0);
        state.fill(0);
        moving = false;
      };

      measure();
      ScrollTrigger.addEventListener('refresh', measure);

      // Sideways, the speed is not the page's: it is how fast the element itself
      // crosses the screen (it rides a track moved by a tween or by a sideways scroll).
      let lastLeft = null;
      let ownVelocity = 0;

      const runner = {
        read: (dt) => {
          // Visibility is measured on the screen, not on the page: inside a pinned
          // section the page position of the text stays frozen while the text moves.
          const r = el.getBoundingClientRect();
          inView = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
          if (!horizontal) return;
          if (!inView) { lastLeft = null; ownVelocity = 0; return; }
          // Positive = scrolling forward, i.e. the content moves to the left. Softened
          // a little, because a track that moves in steps would make it flicker.
          const raw = lastLeft === null ? 0 : -((r.left - lastLeft) / dt) * 1000;
          ownVelocity += (raw - ownVelocity) * 0.4;
          lastLeft = r.left;
        },
        update: (velocity, dt) => {
          if (!inView) {
            if (moving) reset();
            return false;
          }
          // Soft saturation: a calm scroll already gives a clear effect and a
          // fling never goes past `amount`.
          const target = Math.tanh((horizontal ? ownVelocity : velocity) / ref);
          if (!moving && Math.abs(target) < 0.002) return false;

          const base = 1 - Math.exp(-dt / (smooth * 1000));
          let peak = 0;
          for (let i = 0; i < count; i += 1) {
            const w = weight[i];
            // The further along the curve, the slower the part follows the
            // scroll speed, so it also settles later once the scroll stops.
            state[i] += (target - state[i]) * (base / (1 + lag * w));
            const u = state[i];
            setMove[i](curve === 'arc' ? u * amountPx * w : -u * amountPx * (1 - w));
            const a = Math.abs(u);
            if (a > peak) peak = a;
          }
          moving = peak > 0.002;
          if (!moving) reset();
          return true;
        },
        stop: reset,
        stats: () => ({
          parts: count,
          amountPx,
          ref,
          smooth,
          lag,
          curve,
          axis: horizontal ? 'x' : 'y',
          inView,
          moving,
          peak: state.reduce((m, v) => Math.max(m, Math.abs(v)), 0),
          weights: [weight[0], weight[count >> 1], weight[count - 1]]
        })
      };

      flowRunners.add(runner);
      startFlowTicker();

      env.cleanups.add(() => {
        flowRunners.delete(runner);
        ScrollTrigger.removeEventListener('refresh', measure);
        reset();
        stopFlowTickerIfIdle();
      });
    });
  };

  const releaseEnv = (env) => {
    env.pending.forEach((observer) => observer.disconnect());
    env.cleanups.forEach((fn) => fn());
    env.cleanups.clear();
  };

  /**
   * Main Lifecycle orchestrator with gsap.matchMedia()
   */
  const init = (scope = document.body) => {
    destroy();
    mm = gsap.matchMedia();

    const revealElements = gsap.utils.toArray('[pi-animate]', scope);
    const scrollElements = gsap.utils.toArray('[pi-scroll]', scope);
    const stackElements = gsap.utils.toArray('[pi-stack]', scope);
    const pinElements = gsap.utils.toArray('[pi-pin]', scope);
    const flowElements = gsap.utils.toArray('[pi-flow]', scope);

    // Desktop Setup
    mm.add(DESKTOP_BREAKPOINT, (ctx) => {
      const env = { ctx, pending: new Set(), cleanups: new Set() };
      revealElements.forEach((el) => {
        const config = parseConfig(el.getAttribute('pi-animate'));
        createReveal(el, config, env);
      });

      scrollElements.forEach((el) => {
        const config = parseConfig(el.getAttribute('pi-scroll'));
        createScrollEffect(el, config, env);
      });

      stackElements.forEach((el) => {
        const config = parseConfig(el.getAttribute('pi-stack'));
        createStack(el, config, env);
      });

      pinElements.forEach((el) => {
        const config = parseConfig(el.getAttribute('pi-pin'));
        createPin(el, config);
      });

      flowElements.forEach((el) => {
        const config = parseConfig(el.getAttribute('pi-flow'));
        createFlow(el, config, env);
      });

      // Runs when this breakpoint stops matching or on destroy().
      return () => releaseEnv(env);
    });

    // Mobile Setup (Overrides applied)
    mm.add(MOBILE_BREAKPOINT, (ctx) => {
      const env = { ctx, pending: new Set(), cleanups: new Set() };
      revealElements.forEach((el) => {
        const baseConfig = parseConfig(el.getAttribute('pi-animate'));
        const mobileConfig = { ...baseConfig, ...(baseConfig.mobile || {}) };
        createReveal(el, mobileConfig, env);
      });

      scrollElements.forEach((el) => {
        const baseConfig = parseConfig(el.getAttribute('pi-scroll'));
        const mobileConfig = { ...baseConfig, ...(baseConfig.mobile || {}) };
        createScrollEffect(el, mobileConfig, env);
      });

      stackElements.forEach((el) => {
        const baseConfig = parseConfig(el.getAttribute('pi-stack'));
        const mobileConfig = { ...baseConfig, ...(baseConfig.mobile || {}) };
        createStack(el, mobileConfig, env);
      });

      pinElements.forEach((el) => {
        const baseConfig = parseConfig(el.getAttribute('pi-pin'));
        const mobileConfig = { ...baseConfig, ...(baseConfig.mobile || {}) };
        createPin(el, mobileConfig);
      });

      flowElements.forEach((el) => {
        const baseConfig = parseConfig(el.getAttribute('pi-flow'));
        const mobileConfig = { ...baseConfig, ...(baseConfig.mobile || {}) };
        createFlow(el, mobileConfig, env);
      });

      // Runs when this breakpoint stops matching or on destroy().
      return () => releaseEnv(env);
    });
  };

  const destroy = () => {
    if (mm) {
      mm.revert();
      mm = null;
    }
    splitRegistry.forEach((split) => split.revert());
    splitRegistry.clear();
    containerRegistry.clear();
  };

  /**
   * Forces ScrollTrigger to recompute every trigger's start/end position
   * and every fill-mode parallax delta (via invalidateOnRefresh). Call this
   * after any layout change that ScrollTrigger's own resize observer won't
   * catch on its own - e.g. a lazy-loaded image finishing decode, an
   * accordion/tab panel opening, or content injected via AJAX. It does NOT
   * re-run SplitText: if line breaks themselves need to be re-measured
   * (typically after a web font swap), call `init(scope)` again instead -
   * see the file-level doc comment.
   */
  const refresh = () => ScrollTrigger.refresh();

  // Development aid: what every running pi-flow currently uses and is doing.
  const flowStats = () => ({
    braked: flowBraked,
    ticker: flowTickerOn,
    frameAvgMs: Math.round(flowFrameAvg * 10) / 10,
    runners: [...flowRunners].map((runner) => runner.stats())
  });

  return { init, destroy, refresh, flowStats };
})();