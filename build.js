const fs = require('fs');

const { MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!MAPBOX_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required env vars: MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

fs.writeFileSync(
  'config.local.js',
  `window.MAPBOX_TOKEN = '${MAPBOX_TOKEN}';\n` +
  `window.SUPABASE_URL = '${SUPABASE_URL}';\n` +
  `window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';\n`
);

console.log('config.local.js generated');
