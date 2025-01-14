/**
 * Copyright (C) 2022-2023 Zukaritasu
 * 
 * his program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} = require('discord.js');

const resource = require('./resource');
const request = require('./request');
const utils = require('./utils');
const { urls, emojis } = require('../resource.json');
const countries = require('../locale/locale-info.json')
const countries2 = require('../locale/countries.json')
const axios = require('axios');
const logger = require('./logger');


const author = {
	name: 'PointerBot',
	iconURL: urls.favicon
};

const EMBED_COLOR = 0x2B2D31 /** Black */

function getPlayerDemonsCompleted(demons) {
	let main = 0, extended = 0, legacy = 0;
	for (const demon of demons) {
		if (demon.progress != 100)
			continue;
		if (demon.position <= 75)
			main++;
		else if (demon.position <= 150)
			extended++;
		else
			legacy++;
	}
	return `${main} Main, ${extended} Extended, ${legacy} Legacy`;
}

function getHardestDemon(demons) {
	let hardest = 'None';
	if (demons.length != 0) {
		let position = Number.MAX_SAFE_INTEGER;
		for (const demon of demons) {
			if (position > demon.position && demon.progress === 100) {
				position = demon.position;
				hardest = demon.name + ' ' + resource.getTrophy('demon', demon.position);
			}
		}
	}
	return hardest;
}

function addDemonInField(struct, demon, completed) {
	let demon_name = (struct[1].value.length != 0 ? ' - ' : '') + demon.name.replace(' ', '\u00A0');
	if (!completed)
		demon_name += ' ' + utils.getTextStyleByPosition(`(${demon.progress}%)`, demon.position);
	if ((struct[1].value.length + demon_name.length) > 1024) {
		struct[0].push({ name: '\u200B', value: '' });
		if (demon_name.startsWith(' - ')) {
			demon_name = demon_name.substring(3, demon_name.length);
		}
	}
	struct[0][struct[0].length - 1].value += demon_name;
}

function getFieldsDemons(field_name, demons, completed, useVerifier) {
	if (demons.length == 0)
		return { name: field_name, value: 'None' };
	let fields = [{ name: field_name, value: '' }];
	for (const demon of demons) {
		if (useVerifier) {
			if (demon.verifier) {
				addDemonInField([fields, fields[fields.length - 1]], demon, completed);
			}
			continue
		}
		if (!((completed && demon.progress != 100) || (!completed && demon.progress == 100))) {
			addDemonInField([fields, fields[fields.length - 1]], demon, completed);
		}
	}
	return fields[0].value.length == 0 ?
		{
			name: field_name,
			value: 'None'
		} : fields;
}

/////////////////////////////////////////////////
//  EMBEDS
/////////////////////////////////////////////////

function getLeaderboardCountryEmbed(players, page, code, next) {
	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setCustomId('back')
		//.setLabel('←')
		.setEmoji(emojis.id.arrowleft)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page === 0)
	const followButton = new ButtonBuilder()
		.setCustomId('follow')
		//.setLabel('→')
		.setEmoji(emojis.id.arrowright)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(utils.isNullOrUndefined(next))
	const closeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Danger)
		.setEmoji(emojis.id.closeicon)
		.setCustomId("close")

	row.addComponents(backButton, followButton, closeButton);

	let description = (() => {
		let lines = '';

		if (players.length > 0) {
			const padCount = `${players.length}`.length;
			for (let i = 0, pos = (25 * page) + 1; i < players.length; i++, pos++) {
				const player = players[i];
				lines += `\`${`${pos}`.padStart(padCount, ' ')}\` - **${player.name}** *${player.score.toFixed(2)}*\n`;
			}
		}
		return lines;
	})();

	let footerText = `Page ${page + 1}`
	const player = players[0]
	if ('nationality' in player) {
		footerText = `${player.nationality.nation}  - ${footerText}`
	}

	const embed = new EmbedBuilder()
		.setAuthor(author)
		.setColor(EMBED_COLOR)
		.setTitle('Country stats ' + player.nationality.nation)
		.setDescription(description)
		.setFooter({ text: footerText })
		.setThumbnail(`https://flagcdn.com/h240/${code}.png`)

	return { content: '', embeds: [embed], components: [row] }
}

async function getDemonEmbed(demon) {
	let demonVideo = demon.video;
	let thumbnail = demon.thumbnail;

	if (!demonVideo) {
		const info = await request.getFirstVictorInfo(demon.position);
		if (info != null) {
			demonVideo = info.video;
			let videoId = demonVideo.split('v=')[1];
			const ampersandPosition = videoId.indexOf('&');
			if (ampersandPosition !== -1) {
				videoId = videoId.substring(0, ampersandPosition);
			}
			thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

			try {
				await axios.get(thumbnail);
			} catch (error) {
				thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
			}
		} else {
			demonVideo = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
			thumbnail = 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg';
		}
	}

	const demon_embed = new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setAuthor(author)
		.setTitle(demon.name)
		.addFields(
			{ name: 'Position', value: `${demon.position}`, inline: true },
			{ name: 'Publisher', value: utils.getUserNameBanned(demon.publisher), inline: true },
			{ name: 'Verifier', value: utils.getUserNameBanned(demon.verifier), inline: true },
			{ name: 'First Victor', value: await request.getFirstVictor(demon.position, true), inline: true },
			{ name: 'Level ID', value: `${demon.level_id == null ? 'unknown' : demon.level_id}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true }
		)
		.setThumbnail(resource.getDemonImageClassification(
			await request.getLevelClassification(demon.level_id)))
		.setImage(thumbnail)
		.setTimestamp()
		.setFooter({ text: `PointerBot` });



	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setLabel('Pointercrate')
		.setURL(`${urls.pointercrate}demonlist/permalink/${demon.id}`)
		.setStyle(ButtonStyle.Link)
	const followButton = new ButtonBuilder()
		.setLabel('Video')
		.setURL(demonVideo)
		.setStyle(ButtonStyle.Link)

	const closeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Danger)
		.setEmoji(emojis.id.closeicon)
		.setCustomId("close")

	row.addComponents(backButton, followButton, closeButton);

	return { embeds: [demon_embed], components: [row] };
}

async function getPlayerEmbed(player, demons) {
	let embed = new EmbedBuilder()
	embed.setColor(0x2f9960)
	embed.setAuthor(author)
	embed.setTitle(player.name)
	embed.addFields(
			{ name: 'Demonlist rank', value: `${player.rank} ${resource.getTrophy('player', player.rank)}`, inline: true },
			{ name: 'Demonlist score', value: player.score.toFixed(2), inline: true },
			{ name: 'Demonlist stats', value: getPlayerDemonsCompleted(demons), inline: true },
			{ name: 'Hardest demon', value: getHardestDemon(demons), inline: true }
		)
	embed.setThumbnail(`https://flagcdn.com/h240/${player.nationality.country_code.toLowerCase()}.png`)
	embed.addFields(getFieldsDemons('Demons Completed', demons, true, false))
	embed.addFields(getFieldsDemons('Progress on', demons, false, false))
	embed.addFields(getFieldsDemons('Demons verified', demons, true, true))
	embed.setTimestamp()
	embed.setFooter({ text: `PointerBot` });
	return embed;
}

////
////************************************************************************** */
////

function getDemonlistEmbed2(demons, page, title, footer_text, legacy) {
	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setEmoji(emojis.id.arrowleft)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page == 1)
	const followButton = new ButtonBuilder()
		.setCustomId('follow')
		.setEmoji(emojis.id.arrowright)
		.setStyle(ButtonStyle.Primary)
		.setDisabled((!legacy && page == 3) || demons.length != 25)
	const closeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Danger)
		.setEmoji(emojis.id.closeicon)
		.setCustomId("close")

	row.addComponents(backButton, followButton, closeButton);

	let description = (() => {
		let lines = ``;
		if (demons.length !== 0) {
			const padCount = `${demons[demons.length - 1].position}`.length;
			demons.forEach(demon => {
				//lines += `${`\`${`${demon.position}`.padStart(padCount, ' ')}\`` } - ${ demon.name } \n`;
				//lines += `${`\`${`${demon.position}`.padStart(padCount, ' ')}\``} <:Featured_Extreme_Demon:1246530936611274854> **${demon.name}** *by* ${utils.getUserNameBanned(demon.publisher)} *Verifier* ${utils.getUserNameBanned(demon.verifier)}\n`;
				lines += `${`\`${`${demon.position}`.padStart(padCount, ' ')}\``} <:Extreme_Demon:1246531162638385302> **${demon.name}** *${utils.getUserNameBanned(demon.publisher)}*\n`;
			});
		}
		return lines;
	})();

	/*const embed = new EmbedBuilder()
		.setAuthor(author)
		.setColor(EMBED_COLOR)
		.setTitle(title)
		.setDescription(description)
		.setFooter({ text: footer_text })
		.setTimestamp()*/

	return { content: description/*embeds: [embed]*/, components: [row] };
}

////************************************************************************** */

function getDemonlistEmbed(demons, page, title, footer_text, legacy) {
	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setEmoji(emojis.id.arrowleft)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page == 1)
	const followButton = new ButtonBuilder()
		.setCustomId('follow')
		.setEmoji(emojis.id.arrowright)
		.setStyle(ButtonStyle.Primary)
		.setDisabled((!legacy && page == 3) || demons.length != 25)

	row.addComponents(backButton, followButton);

	let description = (() => {
		let lines = '';
		if (demons.length !== 0) {
			const padCount = `${demons[demons.length - 1].position}`.length;
			demons.forEach(demon => {
				//lines += `${`\`${`${demon.position}`.padStart(padCount, ' ')}\`` } - ${ demon.name } \n`;
				lines += `${`\`${`${demon.position}`.padStart(padCount, ' ')}\``} - **${demon.name}** *by* [${utils.getUserNameBanned(demon.publisher)}](https://pointercrate.com) *Verifier* [${utils.getUserNameBanned(demon.verifier)}](https://pointercrate.com)\n`;
			});
		}
		return lines;
	})();

	const embed = new EmbedBuilder()
		.setAuthor(author)
		.setColor(EMBED_COLOR)
		.setTitle(title)
		.setDescription(description)
		.setFooter({ text: footer_text })
		.setTimestamp()

	return { embeds: [embed], components: [row] };
}

function getRankingEmbed(responseData, page) {
	if (responseData.data.length === 0) {
		return {
			content: 'Pointercrate API: page limit has been reached',
			message: {
				embeds: [], components: []
			}
		};
	}

	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setCustomId('back')
		//.setLabel('←')
		.setEmoji(emojis.id.arrowleft)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page === 1)
	const followButton = new ButtonBuilder()
		.setCustomId('follow')
		//.setLabel('→')
		.setEmoji(emojis.id.arrowright)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(responseData.data.length !== 25 || responseData.page.get('next') == undefined)

	row.addComponents(backButton, followButton);

	let description = (() => {
		let lines = '';

		const players = responseData.data;
		if (players.length > 0) {
			const padCount = `${players[players.length - 1].rank}`.length;
			players.forEach(player => {
				const country = player.nationality == null ? ':united_nations:' :
					`:flag_${player.nationality.country_code.toLowerCase()}:`

				//lines += `${country} ${`\`${`${player.rank}`.padStart(3, '0')}\``} - **${player.name}** *${player.score.toFixed(2)}*\n`;
				//lines += `${country} #${player.rank} **${player.name}** *${player.score.toFixed(2)}*\n`;
				lines += `${country} ${`\`${`${player.rank}`.padStart(padCount, ' ')}\``} - **${player.name}** *${player.score.toFixed(2)}*\n`;
			});
		}

		return lines;
	})();

	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setAuthor(author)
		.setTitle('International ranking')
		.setDescription(description)
		.setFooter({ text: `Page ${page}` })
		//.setThumbnail('https://media.discordapp.net/attachments/1041217295743197225/1041217599016542298/extreme_demon.png')
		.setTimestamp()

	return { content: null, message: { embeds: [embed], components: [row] } }
}

// Función para obtener el emoji de bandera basado en el código del país
function getFlagEmoji(countryCode) {
	const codePoints = countryCode.toUpperCase()
		.split('')
		.map(char => 127397 + char.charCodeAt());
	return String.fromCodePoint(...codePoints);
}

function getCountryEmbed(page) {
	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('country')
		.setPlaceholder('Select a country');

	const sortCountry = countries2.data.sort(function (a, b) {
		if (a.name.charCodeAt(0) < b.name.charCodeAt(0)) {
			return -1;
		} else if (a.name.charCodeAt(0) > b.name.charCodeAt(0)) {
			return 1;
		}
		return 0;
	})

	const countRows = 20;
	let description = ''
	for (let i = countRows * (page - 1); i < sortCountry.length && i != (countRows * (page)); i++) {
		description += `\`${`${i + 1}`.padEnd(3, ' ')}\` ${sortCountry[i].name}\n`
		let countryName = sortCountry[i].name;
		if (countryName.length > countRows) {
			countryName = countryName.substring(0, 22).concat('...')
		}

		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(countryName)
			.setValue(sortCountry[i].code)
			.setEmoji(getFlagEmoji(sortCountry[i].code))
		);
	}

	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	const row = new ActionRowBuilder()

	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setEmoji(emojis.id.arrowleft)
		.setStyle(ButtonStyle.Primary)
		.setDisabled(page == 1)
	const followButton = new ButtonBuilder()
		.setCustomId('follow')
		.setEmoji(emojis.id.arrowright)
		.setStyle(ButtonStyle.Primary)
		.setDisabled((countRows * page) > sortCountry.length)
	const closeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Danger)
		.setEmoji(emojis.id.closeicon)
		.setCustomId("close")

	row.addComponents(backButton, followButton, closeButton);

	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setAuthor(author)
		.setTitle('List of Countries with stats')
		.setDescription(description)
		.setFooter({ text: `Page ${page}` })
		.setTimestamp()

	return {
		embeds: [embed],
		components: [comboboxComponent, row]
	}
}

function getLevelListEmbed(demons, begin, countListEments) {
	let description = '';
	let list_count = 0;

	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('demon')
		.setPlaceholder('Select a demon')

	for (let i = begin; i < demons.length && i < begin + countListEments; i++) {
		const demon = demons[i];
		list_count++;
		description += `\`${`${(i + 1)}`.padStart(2, '0')}\` - ${demon.name} *by ${demon.publisher.name}*\n`;
		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(`${demon.name} by ${demon.publisher.name}`)
			.setValue(`${i}`)
		);
	}

	const listEmbed = new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setAuthor(author)
		.setTitle('Demons')
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: `PointerBot` });

	let buttonsComponent = new ActionRowBuilder();
	if (demons.length > countListEments) {
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(begin < countListEments)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(list_count < countListEments || begin + countListEments >= demons.length)

		buttonsComponent.addComponents(backButton, followButton);
	}

	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	return buttonsComponent.components.length == 0 ?
		{
			embeds: [listEmbed],
			components: [comboboxComponent]
		} :
		{
			embeds: [listEmbed],
			components: [buttonsComponent, comboboxComponent]
		}
}

function getPlayerListEmbed(players_json, begin, countListElements) {
	let description = '';
	let list_count = 0;

	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('player')
		.setPlaceholder('Select a player')

	for (let i = begin; i < players_json.length && i < begin + countListElements; i++) {
		const player = players_json[i];
		list_count++;
		description += `${`${i + 1}`.padStart(2, '0')} - ${player.name} *score ${player.score.toFixed(2)}*\n`;
		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(player.name)
			.setValue(player.name)
		);
	}

	const playerListEmbed = new EmbedBuilder()
		.setColor(0x2F3136)
		.setAuthor(author)
		.setTitle('Players')
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: `PointerBot` });

	let buttonsComponent = new ActionRowBuilder();
	if (players_json.length > countListElements) {
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(begin < countListElements)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(list_count < countListElements || begin + countListElements >= players_json.length)

		buttonsComponent.addComponents(backButton, followButton);
	}

	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	return buttonsComponent.components.length == 0 ?
		{
			embeds: [playerListEmbed],
			components: [comboboxComponent]
		} :
		{
			embeds: [playerListEmbed],
			components: [buttonsComponent, comboboxComponent]
		}
}

/*const __help_commands = (() => {
	let commands = []
	fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && !file.startsWith('_')).forEach(file => {
		const command = require(path.join(commandsPath, file));
		commands.set(command.data.name, command);
	});
})();*/

/*function getComboHelpEmbed() {
	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('player')
		.setPlaceholder('Select a player')

	for (let i = begin; i < players_json.length && i < begin + countListElements; i++) {

		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(player.name)
			.setValue(player.name)
		);
	}

	const playerListEmbed = new EmbedBuilder();

	let buttonsComponent = new ActionRowBuilder();
	const closeButton = new ButtonBuilder()
		.setCustomId('close')
		.setLabel('X')
		.setStyle(ButtonStyle.Primary)
	buttonsComponent.addComponents(closeButton);
		
	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	return { 
		embeds: [playerListEmbed], 
		components: [buttonsComponent, comboboxComponent] 
	}
}*/

module.exports = {
	author,
	getDemonEmbed,
	getPlayerEmbed,
	getDemonlistEmbed,
	getRankingEmbed,
	getCountryEmbed,
	getLeaderboardCountryEmbed,
	getLevelListEmbed,
	getPlayerListEmbed,
	getDemonlistEmbed2,
	/*getComboHelpEmbed*/

	/************** */
	COLOR: 0x2f9960,
	/*author: {
		name: 'PointerBot',
		iconURL: urls.favicon
	}*/
	author: {
		name: 'Demonlist',
		iconURL: 'https://cdn.discordapp.com/icons/395654171422097420/379cfde8752cedae26b7ea171188953c.png'
	}
};