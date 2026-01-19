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
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    console.log("Initializing WhatsApp Client...");
    client.on('loading_screen', (percent, message) => {
        console.log('LOADING SCREEN', percent, message);
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED. Please scan it with your phone:');
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
