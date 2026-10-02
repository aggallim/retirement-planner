// Regenerates the Tailwind CSS inlined in index.html (intent 036).
//
//   cd tools/tailwind && npm install && npm run build
//
// 1. Copies the app script (from the inline icon set to its </script>) out
//    of index.html into .app-src.js, so Tailwind scans the app's own code
//    rather than the inlined React/Recharts bundles.
// 2. Runs the Tailwind CLI with tailwind.config.js.
// 3. Replaces the contents of the first <style> tag that holds Tailwind's
//    output (the one starting with Tailwind's preflight variables).
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(here, '..', '..', 'index.html');
const html = readFileSync(indexPath, 'utf8');

const appStart = html.indexOf('<script>// Inline icon set');
if (appStart === -1) throw new Error('App script start marker not found in index.html');
const appEnd = html.indexOf('</script>', appStart);
writeFileSync(path.join(here, '.app-src.js'), html.slice(appStart, appEnd));

const out = path.join(here, '.out.css');
execFileSync(path.join(here, 'node_modules', '.bin', 'tailwindcss'),
  ['-c', 'tailwind.config.js', '-i', 'input.css', '-o', out, '--minify'],
  { cwd: here, stdio: 'inherit' });
const css = readFileSync(out, 'utf8').trim();

const marker = '<style>*,:after,:before{--tw-border-spacing-x';
const styleStart = html.indexOf(marker);
if (styleStart === -1) throw new Error('Tailwind <style> block not found in index.html');
const styleEnd = html.indexOf('</style>', styleStart);
// Tailwind's own license banner is dropped to keep the line identical in
// shape to the original one-off build.
const body = css.replace(/^\/\*![^*]*\*+(?:[^/*][^*]*\*+)*\//, '');
writeFileSync(indexPath, html.slice(0, styleStart) + '<style>' + body + html.slice(styleEnd));
rmSync(path.join(here, '.app-src.js'));
rmSync(out);
console.log(`Inlined ${body.length} bytes of Tailwind CSS into index.html`);
