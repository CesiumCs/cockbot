const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { createClient } = require('../lib/jellyfin');

async function sendChunked(interaction, content) {
    const newlineIndex = content.indexOf('\n');
    
    // If there's no newline, or the content is short, just send it all.
    if (newlineIndex === -1 || content.length <= 2000) {
        return interaction.editReply(content);
    }

    const firstLine = content.substring(0, newlineIndex);
    const restOfContent = content.substring(newlineIndex + 1);

    await interaction.editReply(firstLine);

    if (restOfContent.length > 0) {
        const messages = [];
        let i = 0;
        while (i < restOfContent.length) {
            let end = i + 2000;
            if (end > restOfContent.length) {
                end = restOfContent.length;
            } else {
                const lastNewline = restOfContent.lastIndexOf('\n', end);
                if (lastNewline > i) {
                    end = lastNewline;
                }
            }
            messages.push(restOfContent.substring(i, end));
            i = end;
            if (restOfContent.charAt(i) === '\n') i++; // move past newline
        }

        for (const chunk of messages) {
            if (chunk.length > 0) { // Don't send empty messages
                await interaction.channel.send({
                    content: chunk,
                    flags: 4096,
                });
            }
        }
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jellyfin')
		.setDescription('Get media from media.cesium.one')
		.addSubcommand((s) =>
			s
				.setName('search')
				.setDescription('Search items')
				.addStringOption((o) => o.setName('query').setDescription('Search query').setRequired(true))
				.addIntegerOption((o) => o.setName('limit').setDescription('Max results').setRequired(false))
		).addSubcommand((s) =>
			s
				.setName('series')
				.setDescription('Get info about a series')
                .addStringOption((o) => o.setName('series').setDescription('Series ID or search term').setRequired(true))
				.addIntegerOption((o) => o.setName('season').setDescription('Season number').setRequired(false))
		).addSubcommand((s) =>
			s
				.setName('movie')
				.setDescription('Get info about a movie')
                .addStringOption((o) => o.setName('movie').setDescription('Movie ID or search term').setRequired(true))
		),

	async execute(interaction) {
		if (!config.jellyfin.users.includes(interaction.user.id)) {
			interaction.reply({ content: 'You are not authorized to use this command.', flags: 64 });
			return;
		} else if (interaction.channel.type !== 1) {
			interaction.reply({ content: 'Please keep this command in DMs. It exposes a direct API key for my media server.', flags: 64 });
			return;
		}
		const sub = interaction.options.getSubcommand();
		const jelly = createClient(config.jellyfin || {});

		if (!config.jellyfin || !config.jellyfin.url) {
			await interaction.reply('Jellyfin not configured (check config.jellyfin.url/key)');
			return;
		}

		await interaction.deferReply();

		try {
			if (sub === 'search') {
				const query = interaction.options.getString('query');
				const limit = interaction.options.getInteger('limit') || 10;
				const params = {
					SearchTerm: query,
					Limit: limit,
					Recursive: true,
					IncludeItemTypes: 'Movie,Series',
					Fields: 'Overview,PrimaryImageAspectRatio'
				};
				const res = await jelly.request('/Items', params);
				const items = Array.isArray(res.Items) ? res.Items : [];
				if (!items || items.length === 0) return await interaction.editReply('No results');
				const lines = items.slice(0, limit).map((it) => `${it.Name} - ${it.Id} (${it.Type || it.SeriesType || 'item'})`);
                const out = `Results for ${query}\n${lines.join('\n')}`;
				return sendChunked(interaction, out);
			}
            
            if (sub === 'series') {
				const id = interaction.options.getString('series');
				const season = interaction.options.getInteger('season');

				// If `id` isn't a 32-char hex ID (allowing dashes), treat it as a search term
				const cleaned = (id || '').replace(/-/g, '');
				const isId = /^[a-f0-9]{32}$/i.test(cleaned);
				let seriesId = id;
				if (!isId) {
					const sres = await jelly.request('/Items', {
						SearchTerm: id,
						IncludeItemTypes: 'Series',
						Limit: 1,
						Recursive: true
					});
					const sitems = Array.isArray(sres.Items) ? sres.Items : [];
					if (!sitems || sitems.length === 0) return await interaction.editReply('No series found');
					seriesId = sitems[0].Id;
				}
                if (!season) {
                    const res = await jelly.request(`/Shows/${seriesId}/Seasons`);
                    const items = Array.isArray(res.Items) ? res.Items : [];
                    if (!items || items.length === 0) return await interaction.editReply('No seasons found');
                    const lines = items.map((it) => `${it.Name} - ${it.Id}`);
                    const out = `Seasons for ${items[0].SeriesName}\n${lines.join('\n')}`;
                    return sendChunked(interaction, out);
                }

				const res = await jelly.request(`/Shows/${seriesId}/Episodes`, {season: season});
				const items = Array.isArray(res.Items) ? res.Items : [];
				if (!items || items.length === 0) return await interaction.editReply('No episodes found');
				console.log(items[0])
				const lines = items.map((it) => `${it.IndexNumber}. ${it.Name} [[source](${config.jellyfin.url}/Items/${it.Id}/Download?api_key=${config.jellyfin.key})] [[480p](${config.jellyfin.url}/Videos/${it.Id}/stream?api_key=${config.jellyfin.key}&videoCodec=h264&width=854&height=480)]`);
				const out = `Episodes for ${items[0].SeriesName} ${items[0].SeasonName}\n${lines.join('\n')}`;
				return sendChunked(interaction, out);
			}

            if (sub === 'movie') {
				const id = interaction.options.getString('movie');

				// If `id` isn't a 32-char hex ID (allowing dashes), treat it as a search term
				const cleaned = (id || '').replace(/-/g, '');
				const isId = /^[a-f0-9]{32}$/i.test(cleaned);
				let movieId = id;
				if (!isId) {
					const sres = await jelly.request('/Items', {
						SearchTerm: id,
						IncludeItemTypes: 'Movie',
						Limit: 1,
						Recursive: true
					});
					const sitems = Array.isArray(sres.Items) ? sres.Items : [];
					if (!sitems || sitems.length === 0) return await interaction.editReply('No movies found');
					movieId = sitems[0].Id;
				}

				const res = await jelly.request(`/Items/${movieId}`);
				let out = `[${res.Name}](${config.jellyfin.url}/Items/${res.Id}/Download?api_key=${config.jellyfin.key})`;
				out += `\n([h264 transcode if above fails](${config.jellyfin.url}/Videos/${res.Id}/stream?api_key=${config.jellyfin.key}&videoCodec=h264))`
				out += `\n([480p transcode if above fails](${config.jellyfin.url}/Videos/${res.Id}/stream?api_key=${config.jellyfin.key}&videoCodec=h264&width=854&height=480))`
				return sendChunked(interaction, out);
			}

			await interaction.editReply('Unknown subcommand');
		} catch (err) {
			await interaction.editReply(`Error fetching from Jellyfin: ${err.message}`);
		}
	},
};