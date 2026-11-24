// Light theme for the checkout pages: swaps the dark palette for the dashboard's light palette.
const MAP = {
  '#08080A': '#F4F5F7', '#111113': '#FFFFFF', '#18181A': '#F1F3F6', '#13202E': '#E6F0FA', '#26262A': '#E1E4E9', '#3A3A40': '#C5CAD2',
  '#F4F2F1': '#101216', '#D4CFCD': '#2B2E34', '#9C9693': '#5E636C', '#6E6A67': '#8A8F98', '#7CC4FF': '#1C84DE', '#A9D8FF': '#1569B3',
  '#5FD39B': '#139A63', '#F2777F': '#D8394A', '#F2C46D': '#B87A0A', '#FFFFFF': '#101216', '#FFF': '#101216',
  '#0D0D10': '#FFFFFF', '#1C1C20': '#ECEEF2', '#0B0B0D': '#FFFFFF'
};
const RGBA = { '124,196,255': '28,132,222', '255,255,255': '16,18,22', '95,211,155': '19,154,99', '242,119,127': '216,57,74', '242,196,109': '184,122,10', '8,8,10': '244,245,247' };
const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
const re = new RegExp('(' + keys.map((k) => k.replace('#', '\\#')).join('|') + ')(?![0-9A-Fa-f])', 'gi');
function lighten(s) {
  return s.replace(re, (m) => MAP[m.toUpperCase()] || m)
    .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,/g, (m, r, g, b) => { const k = `${r},${g},${b}`; return RGBA[k] ? `rgba(${RGBA[k]},` : m; })
    .replace(/color-scheme:\s*dark/g, 'color-scheme: light');
}
module.exports = { lighten, MAP };
if (require.main === module) { const fs = require('fs'); const [src, dst] = process.argv.slice(2); fs.writeFileSync(dst, lighten(fs.readFileSync(src, 'utf8'))); }
