# Tailwind CSS regeneration (dev-only)

`index.html` inlines a pre-built Tailwind stylesheet. Before intent 036 it
was generated once, so any utility class used for the first time later
silently did nothing (`docs/TOOL_DOCUMENTATION.md` §5.1).

After adding or changing classes in `index.html`:

```sh
cd tools/tailwind
npm install      # once
npm run build    # rewrites the Tailwind <style> block in ../../index.html
```

Then commit `index.html`. The site itself still has no build step.

- `safelist.json` holds every class from the original build, so output is
  always a superset of what shipped before.
- `tailwind.config.js` is also where the brand palette lives (intent 056).
- Dynamic class names built from strings (e.g. `` `bg-${x}-50` ``) aren't
  seen by the scanner. Write class names out in full, or add them to the
  safelist.
