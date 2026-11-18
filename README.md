# PI Motion

Declarative scroll motion for the web. Describe animations with HTML attributes; PI Motion wires up GSAP, ScrollTrigger and SplitText for you.

```html
<h1 pi-animate="type: split; split: words; stagger: 0.06">Motion that follows the scroll.</h1>
<img pi-scroll="type: parallax; speed: 200" src="photo.jpg">
<section pi-pin="end: +=1200">...</section>
```

## Attributes

- `pi-animate`: one-shot reveal (fade, slide, split, scale)
- `pi-scroll`: scroll-linked effects (parallax, fade, split, scale, text-reveal)
- `pi-stack`: cycles through children while scrolling
- `pi-pin`: pins a section for a scroll distance

Each one has a `mobile: { ... }` override for viewports up to 768px.

## Install

```bash
npm install gsap pi-motion
```

GSAP **3.13 or newer** is required (SplitText is free from that version). GSAP is a peer dependency and is not bundled; it is distributed under its own [license](https://gsap.com/standard-license/).

## Usage

```js
import { PiMotion } from 'pi-motion';

document.addEventListener('DOMContentLoaded', () => {
  PiMotion.init();
});
```

Full parameter reference: [docs/reference.md](docs/reference.md).

## License

[MIT](LICENSE)
