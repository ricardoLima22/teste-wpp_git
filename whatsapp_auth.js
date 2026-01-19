const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log("Initializing WhatsApp Authentication...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED. Please scan it with your phone:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    console.log('Authentication successful and session saved.');
    console.log('You can now use whatsapp_sender.js to send messages.');

    // Close after successful auth
    setTimeout(() => {
        client.destroy();
        process.exit(0);
    }, 5000);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    process.exit(1);
});

client.initialize();
