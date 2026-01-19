const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Arguments: recipient_name (Group or contact), caption, file_path
const args = process.argv.slice(2);
const recipientName = args[0];
const caption = args[1] || "";
const filePath = args[2];

if (!recipientName || !filePath) {
    console.error("Usage: node whatsapp_sender.js <recipient_name> <caption> <file_path>");
    process.exit(1);
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        protocolTimeout: 60000 // Increase timeout to 60 seconds
    }
});

client.on('ready', async () => {
    console.log('Client is ready!');

    try {
        console.log("Fetching chats (this might take a moment if you have many)...");
        const chats = await client.getChats();

        console.log(`Searching for '${recipientName}'...`);
        // We search in the cached chats first. 
        // Tip: Using the exact ID (e.g. '123456789@g.us') would be near-instant.
        let chat = chats.find(c => c.name === recipientName || c.id._serialized === recipientName);

        if (chat) {
            console.log(`Chat found: ${chat.name} (${chat.id._serialized})`);

            if (fs.existsSync(filePath)) {
                console.log("Uploading file...");
                const media = MessageMedia.fromFilePath(filePath);
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

        // Wait a bit to ensure message is sent
        setTimeout(() => {
            client.destroy();
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error("Error sending message:", error);
        client.destroy();
        process.exit(1);
    }
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    console.error('Please run "node whatsapp_auth.js" to authenticate.');
    process.exit(1);
});

client.initialize();
