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

let peopleWhoCanFunnyEval = ['230659159450845195', '297983197990354944']

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

    // hehe an eval :3                                                yeah im hardcoding myself
    if (message.content.startsWith('!eval') && peopleWhoCanFunnyEval.includes(message.author.id)) {
        let code = message.content.substring('!eval'.length).trim();

        // yeah a machine may have wrote this part
        const codeBlockRegex = /```(?:js)?\n?([\s\S]+)```/;
        const match = code.match(codeBlockRegex);

        if (match) {
            code = match[1];
        }

        try {
            eval(code);
        } catch (err) {
            console.error(err);
        }
    }

});

// funny auto mpreg react
const mpregs = [
    'mpreg01:1434029622206398556',
    'mpreg02:1434029708038639807',
    'mpreg03:1434029731321352192',
    'mpreg04:1434029755619086517',
    'mpreg05:1434029779514032228',
    'mpreg06:1434029803358523482',
    'mpreg07:1434029827681161266',
    'mpreg08:1434029848866717798',
    'mpreg09:1434029865593606215',
    'mpreg10:1434029885009166467',
    'mpreg11:1434029910158217327',
    'mpreg12:1434029928768077865',
    'mpreg13:1434029953346830417',
    'mpreg14:1434029984808304730',
    'mpreg15:1434030008124309585',
    'mpreg16:1434030025144795207',
    'mpreg17:1434030048586760303',
    'mpreg18:1434030067419451402',
    'mpreg19:1434030085794435092'
]

client.on(Events.MessageReactionAdd, (reaction, user) => {
    if (reaction.emoji.name === '🫃' && !user.bot) {
        reaction.message.react('🫃')
        for (const mpreg of mpregs) {
            reaction.message.react(mpreg).catch(err => console.error(err.stack?.split('\n')[0] || err.message || String(err).split('\n')[0]))
        }

    }
})
