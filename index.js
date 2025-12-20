const config = require('./config.json');
// the basic discord setup stuff yoinked from their guide
const { Client, Events, GatewayIntentBits, Partials, ActivityType, MessageFlags, Collection } = require('discord.js');
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

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const swapRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('swap_twitter')
            .setLabel('Swap URL')
            .setStyle(ButtonStyle.Secondary),
    );

function convertURL(url, regex, domain) {
    const match = url.match(regex);
    if (match) {
        console.log(`Converting ${url} to ${domain}`)
        return `https://${domain}/${match[1]}/status/${match[2]}`;
    }
}

function swapify(url) {
    const girlcockRegex = /https?:\/\/girlcockx\.com\/(.*?)\/status\/(\d+)/;
    const fxtwitterRegex = /https?:\/\/fxtwitter\.com\/(.*?)\/status\/(\d+)/;
    if (url.match(girlcockRegex)) return convertURL(url, girlcockRegex, "fxtwitter.com");
    if (url.match(fxtwitterRegex)) return convertURL(url, fxtwitterRegex, "girlcockx.com");
    // if we got this far, somethings not right but we'll try twitter before giving up
    const twitterRegex = /https?:\/\/x\.com\/(.*?)\/status\/(\d+)/;
    if (url.match(twitterRegex)) return convertURL(url, twitterRegex, "girlcockx.com");
    return url; // give up, we'll just return the original URL
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'swap_twitter') {
            try {
                const regex = /https?:\/\/girlcockx\.com\/(.*?)\/status\/(\d+)/;
                await interaction.update(swapify(interaction.message.content));
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'I couldn\'t swap them for some reason', ephemeral: true });
            }
        }
        return;
    }
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Discord: Connected as ${readyClient.user.tag}`);
    client.user.setActivity(config.status, { type: ActivityType.Custom });
});
client.login(config.token);

client.on(Events.MessageCreate, message => {
    // if we smell a twitter link, girlcock it!
    const twitterRegex = /https?:\/\/x\.com\/(.*?)\/status\/(\d+)/;
    const regexProfile = message.content.match(twitterRegex);
    if (regexProfile) {
        const cocklink = convertURL(regexProfile[0], twitterRegex, "girlcockx.com")
        message.channel.send({ content: cocklink, flags: MessageFlags.SuppressNotifications, components: [swapRow] })
        message.suppressEmbeds().catch(err =>
            // this next bit just cuts down the error to the important part, which will usually end up being "no permissions"
            console.error("Removing original embed failed: " + err.stack?.split('\n')[0] || err.message || String(err).split('\n')[0])
        )
    }
    
    // hehe an eval :3
    if (message.content.startsWith('!eval') && config.parentsAndOrGuardians.includes(message.author.id)) {
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
    // hehe we do a little if stacking
    if (message.content.startsWith('!status') && config.parentsAndOrGuardians.includes(message.author.id)) {
        let status = message.content.substring('!status'.length).trim();
        client.user.setActivity(status, { type: ActivityType.Custom });
        config.status = status;
    }

    // wouldnt it be funny to react to 1 in like 1000 messages with emoji from a list
    if (Math.random() < 0.001 && !message.author.bot) {
        const customEmojis = [
            'Shitten:1430413059574206555',
            'BLOWSUP:1430413011918651503',
            'grin_cat:1445254917991436449'
        ];
        const randomEmoji = customEmojis[Math.floor(Math.random() * customEmojis.length)];
        message.react(randomEmoji);
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

// command handling for ./commands
const fs = require('fs');
const path = require('node:path');
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.debug(`Commands: Registered "${command.data.name}"`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    } try {
        console.debug(`Command: Executing ${interaction.commandName}`);
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        }
    }
});
