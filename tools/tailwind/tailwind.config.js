// Dev-only Tailwind config for the CSS inlined in index.html (intent 036).
// content is the app script that build.mjs extracts from index.html.
// safelist.json holds every class the original one-off build emitted, so a
// regenerated stylesheet is always a superset of what shipped before it.
module.exports = {
  content: ['./.app-src.js'],
  safelist: require('./safelist.json'),
  theme: { extend: {} },
  plugins: []
};
