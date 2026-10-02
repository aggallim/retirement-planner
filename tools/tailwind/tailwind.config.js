// Dev-only Tailwind config for the CSS inlined in index.html (intent 036).
// content is the app script that build.mjs extracts from index.html.
// safelist.json holds every class the original one-off build emitted, so a
// regenerated stylesheet is always a superset of what shipped before it.
//
// Brand palette (intent 056): Tailwind's stock blue (the default "AI app"
// colour) is replaced by "ink", so every existing blue-* class follows the
// brand without touching components. Teal stays as the partner colour.
// Shadows are softened. Dark-mode overrides for these classes are written by
// hand in index.html's inline <style>, next to the other .dark rules.
const ink = {
  50: '#f2f4fa', 100: '#e3e8f4', 200: '#c6d0e8', 300: '#9fb0d6', 400: '#7088bf',
  500: '#4e68a8', 600: '#3a518f', 700: '#2f4275', 800: '#283860', 900: '#232f4f', 950: '#161d33'
};
module.exports = {
  content: ['./.app-src.js'],
  safelist: require('./safelist.json'),
  theme: {
    extend: {
      colors: { blue: ink, ink, marigold: { 500: '#d9a21b' } },
      boxShadow: {
        lg: '0 1px 2px 0 rgb(22 29 51 / 0.04), 0 6px 20px -6px rgb(22 29 51 / 0.10)',
        sm: '0 1px 2px 0 rgb(22 29 51 / 0.05)'
      }
    }
  },
  plugins: []
};
