const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs');

// Arguments: recipient_name (Group or contact), caption, file_path
const args = process.argv.slice(2);
const recipientName = args[0];
const caption = args[1] || "";
const filePath = args[2];

if (!recipientName || !filePath) {
    console.error("Usage: node whatsapp_sender.js <recipient_name> <caption> <file_path>");
    process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI).then(() => {
    console.log("Connected to MongoDB for Sender");
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

    // Handle QR code (Auth failed)
    client.on('qr', (qr) => {
        console.error("ERROR: Session restore failed! WhatsApp is requesting a new QR Code.");
        console.error("This means the saved session in MongoDB is invalid or incompatible.");
        console.error("Please run 'node whatsapp_auth.js' locally again to refresh the session.");
        process.exit(1);
    });

    client.on('ready', async () => {
        console.log('Client is ready!');

        try {
            console.log("Fetching chats (this might take a moment if you have many)...");
            const chats = await client.getChats();

            console.log(`Searching for '${recipientName}'...`);
            let chat = chats.find(c => c.name === recipientName || c.id._serialized === recipientName);

            if (chat) {
                console.log(`Chat found: ${chat.name} (${chat.id._serialized})`);

                if (fs.existsSync(filePath)) {
                    // WARM UP: Send "Typing..." state to establish E2E encryption keys
                    // This is safer than sending text and fixes the "Waiting for message" issue
                    console.log("Sending 'Typing...' state (Warm-up)...");
                    await chat.sendStateTyping();

                    // Wait 5 seconds for keys to exchange
                    await new Promise(r => setTimeout(r, 5000));

                    await chat.clearState();

                    console.log("Uploading file...");
                    const media = MessageMedia.fromFilePath(filePath);
                    // Send file with caption
                    await client.sendMessage(chat.id._serialized, media, { caption: caption, sendSeen: false });
                    console.log(`File sent successfully!`);
                } else {
                    console.error(`File not found: ${filePath}`);
                    process.exit(1);
                }

            } else {
                console.error(`Chat '${recipientName}' not found.`);
                console.log("Available chats (top 10):");
                chats.slice(0, 10).forEach(c => console.log(`- ${c.name}`));
                process.exit(1);
            }

            // Wait to ensure message is sent and encryption keys are exchanged (Fixes "Waiting for message" error)
            console.log("Waiting 30 seconds to ensure delivery and encryption sync...");
            setTimeout(() => {
                console.log("Closing client...");
                client.destroy();
                mongoose.disconnect();
                process.exit(0);
            }, 30000);

        } catch (error) {
            console.error("Error sending message:", error);
            client.destroy();
            mongoose.disconnect();
            process.exit(1);
        }
    });

    client.on('remote_session_saved', () => {
        console.log('Remote session saved to DB.');
    });

    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
        console.error('Please run "node whatsapp_auth.js" to authenticate.');
        process.exit(1);
    });

    client.initialize();
}).catch(err => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});
