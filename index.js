const token = process.env.DISCORD_TOKEN

// the basic discord setup stuff yoinked from their guide
const { Client, Events, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message
      ]
});
client.once(Events.ClientReady, readyClient => {
	console.log(`Discord: Connected as ${readyClient.user.tag}`);
    client.user.setActivity('for x.com links', { type: ActivityType.Watching });
});
client.login(token);

client.on(Events.MessageCreate, message => {
    // if we smell a twitter link, girlcock it!
    const regexProfile = /https?:\/\/x\.com\/(.*?)\/status\/(\d+)/;
    if (message.content.match(regexProfile)) {
        const original = message.content.match(regexProfile)[0]
        const profile = message.content.match(regexProfile)[1]
        const stub = message.content.match(regexProfile)[2]
        console.log(`Chat: Detected ${original}, girlcocking it!`);
        const cocklink = `https://girlcockx.com/${profile}/status/${stub}`
        console.log(`Girlcock: Converted to ${cocklink}`)
        message.channel.send(cocklink)
        message.suppressEmbeds().catch(err =>
            // this next bit just cuts down the error to the important part, which will usually end up being "no permissions"
            console.error(err.stack?.split('\n')[0] || err.message || String(err).split('\n')[0])
        )
    }
});
