async function githubCommand(sock, chatId) {
    const repoInfo = `*🤖 KnightBot MD*

*📂 GitHub Repository:*
https://github.com/dev-patrick-alunya/Knightbot-MD

*📢 Official Channel:*
https://youtube.com/@patrickalunya

_Star ⭐ the repository if you like the bot!_`;

    try {
        await sock.sendMessage(chatId, {
            text: repoInfo,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    // newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'Patrick`s VA',
                    serverMessageId: -1
                }
            }
        });
    } catch (error) {
        console.error('Error in github command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error fetching repository information.' 
        });
    }
}

module.exports = githubCommand; 