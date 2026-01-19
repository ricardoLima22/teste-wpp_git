const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');

console.log("Initializing WhatsApp Authentication...");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    console.error("Please set it to your MongoDB connection string.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI).then(() => {
    console.log("Connected to MongoDB");
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            headless: true,
            executablePath: process.platform === 'win32' ? null : (process.env.CHROME_PATH || '/usr/bin/google-chrome'),
            args: process.platform === 'win32' ? [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ] : [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-first-run',
                '--no-zygote',
                '--disable-accelerated-2d-canvas',
                '--disable-software-rasterizer'
            ],
            dumpio: true, // Enable logs for debug
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            protocolTimeout: 120000,
            bypassCSP: true
        }
    });

    console.log("Initializing WhatsApp Client...");
    client.on('loading_screen', (percent, message) => {
        console.log('LOADING SCREEN', percent, message);
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED. Generating Image...');
        // qrcode-terminal is for terminal, we need 'qrcode' for image.
        // Since we didn't install 'qrcode' package, we will stick to terminal but
        // suggest the user to use "Zoom Out" (CTRL -) on browser.

        // BETTER APPROACH: We will use a public API to generate a QR link for them to click in the logs
        console.log("If the QR Code below is broken, OPEN THIS URL in your browser to scan:");
        console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);

        qrcode.generate(qr, { small: true });
    });

    let isReady = false;
    let isSaved = false;

    const checkAndExit = () => {
        if (isReady && isSaved) {
            console.log(">> SYSTEM: Session fully saved and Client ready. Closing in 5 seconds...");
            setTimeout(() => {
                console.log('Closing client...');
                client.destroy();
                mongoose.disconnect();
                process.exit(0);
            }, 5000);
        }
    };

    client.on('ready', () => {
        console.log('Client is ready!');
        isReady = true;
        checkAndExit();

        // Fallback: If 'remote_session_saved' doesn't fire in 60s, force exit.
        // This happens sometimes when the session is already mostly synced.
        setTimeout(() => {
            if (!isSaved) {
                console.log(">> SYSTEM: Session save event took too long. Assuming saved and closing...");
                console.log('Closing client...');
                client.destroy();
                mongoose.disconnect();
                process.exit(0);
            }
        }, 60000); // 60 seconds
    });

    client.on('remote_session_saved', () => {
        console.log('Remote session saved to DB!');
        isSaved = true;
        checkAndExit();
    });

    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
    });

    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
        process.exit(1);
    });

    client.initialize();
}).catch(err => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});
