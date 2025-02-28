const isOwner = require('../helpers/isOwner');

async function giveAdminRole(sock, chatId, senderId) {
    try {
        // Check if sender is owner
        if (!isOwner(senderId)) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false
                }
            });
            return;
        }

        // Promote bot to admin
        await sock.groupParticipantsUpdate(chatId, [sock.user.id], 'promote');
        await sock.sendMessage(chatId, { 
            text: '✅ Bot has been promoted to admin!',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: false
            }
        });
    } catch (error) {
        console.error('Error in giveAdminRole command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error occurred while promoting bot to admin!\n' + error.message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: false
            }
        });
    }
}

module.exports = {
    giveAdminRole
};
