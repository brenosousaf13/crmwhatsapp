const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching webhook_logs:', error.message);
  } else {
    console.log(`Found ${data.length} recent webhook logs. Columns:`, data.length > 0 ? Object.keys(data[0]) : 'None');
    console.log(data);
  }
}

check();
