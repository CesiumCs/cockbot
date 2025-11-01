const token = process.env.DISCORD_TOKEN

// the basic discord setup stuff yoinked from their guide
const { Client, Events, GatewayIntentBits, Partials, ActivityType, MessageFlags } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.User
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
        message.channel.send({ content: cocklink, flags: MessageFlags.SuppressNotifications })
        message.suppressEmbeds().catch(err =>
            // this next bit just cuts down the error to the important part, which will usually end up being "no permissions"
            console.error(err.stack?.split('\n')[0] || err.message || String(err).split('\n')[0])
        )
    }
});

// funny auto mpreg react
client.on(Events.MessageReactionAdd, (reaction, user) => {
    if (reaction.emoji.name === '🫃' && !user.bot) {
        reaction.message.react('🫃')
        reaction.message.react('mpreg01:1434029622206398556')
        reaction.message.react('mpreg02:1434029708038639807')
        reaction.message.react('mpreg03:1434029731321352192')
        reaction.message.react('mpreg04:1434029755619086517')
        reaction.message.react('mpreg05:1434029779514032228')
        reaction.message.react('mpreg06:1434029803358523482')
        reaction.message.react('mpreg07:1434029827681161266')
        reaction.message.react('mpreg08:1434029848866717798')
        reaction.message.react('mpreg09:1434029865593606215')
        reaction.message.react('mpreg10:1434029885009166467')
        reaction.message.react('mpreg11:1434029910158217327')
        reaction.message.react('mpreg12:1434029928768077865')
        reaction.message.react('mpreg13:1434029953346830417')
        reaction.message.react('mpreg14:1434029984808304730')
        reaction.message.react('mpreg15:1434030008124309585')
        reaction.message.react('mpreg16:1434030025144795207')
        reaction.message.react('mpreg17:1434030048586760303')
        reaction.message.react('mpreg18:1434030067419451402')
        reaction.message.react('mpreg19:1434030085794435092')
    }
})
