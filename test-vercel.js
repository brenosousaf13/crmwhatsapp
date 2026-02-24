const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testVercel() {
    const { data } = await supabase.from('organizations').select('id').limit(1);
    if (!data || !data.length) {
        console.log('No org found');
        return;
    }
    const orgId = data[0].id;

    const payload = {
        event: "messages",
        data: {
            fromMe: false,
            chatid: "551234567890@c.us",
            senderName: "Teste Vercel",
            messageid: "MOCK_MESSAGE_" + Date.now(),
            messageType: "conversation",
            text: "Mensagem de teste simulando webhook externo",
            messageTimestamp: Date.now() / 1000
        }
    };

    const url = `https://crmwhatsapp.vercel.app/api/webhooks/whatsapp?org=${orgId}`;
    console.log('Enviando POST para:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testVercel();
