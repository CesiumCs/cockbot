const { SlashCommandBuilder, ActivityType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Change the bot\'s status message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The new status message')
                .setRequired(true)
        ),
	async execute(interaction) {
        const message = interaction.options.getString('message');
        console.log(`${interaction.user.tag} is changing the status to ${message}`);
        interaction.client.user.setActivity(message, { type: ActivityType.Custom });
        await interaction.reply({ content: `Status updated to: ${message}`, ephemeral: true });
    },
};