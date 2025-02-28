const fs = require('fs');
const path = require('path');
const isOwner = require('../helpers/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: false,
        forwardedNewsletterMessageInfo: {
            // newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'Patrick`s VA',
            serverMessageId: -1
        }
    }
};

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false, autoReact: false }));
}

async function autoStatusCommand(sock, chatId, senderId, args) {
    try {
        // Check if sender is owner
        if (!isOwner(senderId)) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            });
            return;
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!args || args.length === 0) {
            const status = config.enabled ? 'enabled' : 'disabled';
            const reactStatus = config.autoReact ? 'enabled' : 'disabled';
            await sock.sendMessage(chatId, { 
                text: `🔄 *Auto Status View*\n\nCurrent status: ${status}\nAuto React: ${reactStatus}\n\nUse:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view\n.autostatus react on - Enable auto react\n.autostatus react off - Disable auto react`,
                ...channelInfo
            });
            return;
        }

        // Handle on/off commands
        const command = args[0].toLowerCase();
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '✅ Auto status view has been enabled!\nBot will now automatically view all contact statuses.',
                ...channelInfo
            });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '❌ Auto status view has been disabled!\nBot will no longer automatically view statuses.',
                ...channelInfo
            });
        } else if (command === 'react') {
            const reactCommand = args[1]?.toLowerCase();
            if (reactCommand === 'on') {
                config.autoReact = true;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '✅ Auto react to statuses has been enabled!\nBot will now automatically react to all contact statuses.',
                    ...channelInfo
                });
            } else if (reactCommand === 'off') {
                config.autoReact = false;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '❌ Auto react to statuses has been disabled!\nBot will no longer automatically react to statuses.',
                    ...channelInfo
                });
            } else {
                await sock.sendMessage(chatId, { 
                    text: '❌ Invalid command! Use:\n.autostatus react on - Enable auto react\n.autostatus react off - Disable auto react',
                    ...channelInfo
                });
            }
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Invalid command! Use:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view\n.autostatus react on - Enable auto react\n.autostatus react off - Disable auto react',
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error occurred while managing auto status!\n' + error.message,
            ...channelInfo
        });
    }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if auto react is enabled
function isAutoReactEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.autoReact;
    } catch (error) {
        console.error('Error checking auto react config:', error);
        return false;
    }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            console.log('❌ Auto status view is disabled');
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    console.log(`✅ Status Viewed `);

                    // Auto react if enabled
                    if (isAutoReactEnabled()) {
                        await sock.sendMessage(msg.key.remoteJid, { react: { text: '👍', key: msg.key } });
                        console.log(`✅ Reacted to status from: ${sender.split('@')[0]}`);
                    }
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                const sender = status.key.participant || status.key.remoteJid;
                console.log(`✅ Viewed status from: ${sender.split('@')[0]}`);

                // Auto react if enabled
                if (isAutoReactEnabled()) {
                    await sock.sendMessage(status.key.remoteJid, { react: { text: '❤️', key: status.key } });
                    console.log(`✅ Reacted to status from: ${sender.split('@')[0]}`);
                }
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                const sender = status.reaction.key.participant || status.reaction.key.remoteJid;
                console.log(`✅ Viewed status from: ${sender.split('@')[0]}`);

                // Auto react if enabled
                if (isAutoReactEnabled()) {
                    await sock.sendMessage(status.reaction.key.remoteJid, { react: { text: '👍', key: status.reaction.key } });
                    console.log(`✅ Reacted to status from: ${sender.split('@')[0]}`);
                }
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};