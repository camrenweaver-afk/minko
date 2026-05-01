const fs = require('fs');

const { MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!MAPBOX_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required env vars: MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

// Inject config directly into Minko.html so there's no separate file to fetch
let html = fs.readFileSync('Minko.html', 'utf8');
const inlineConfig = `<script>window.MAPBOX_TOKEN='${MAPBOX_TOKEN}';window.SUPABASE_URL='${SUPABASE_URL}';window.SUPABASE_ANON_KEY='${SUPABASE_ANON_KEY}';</script>`;
html = html.replace('<script src="config.local.js"></script>', inlineConfig);
fs.writeFileSync('Minko.html', html);

console.log('Config injected into Minko.html');
