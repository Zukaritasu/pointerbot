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
const { urls } = require('../resource.json');
const countries = require('../locale/locale-info.json')


const author = {
	name: 'Demonlist',
	iconURL: urls.demonlist_icon
};

const EMBED_COLOR = 0x221F22 /** Black */

/**
 * Returns a formatted string with the number of completed list demons
 * according to their position in the demonlist.
 * 
 * @param demons demons array
 * @returns string
 */
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

/**
 * Returns the hardest demon. Will always return the hardest demon,
 * unless the list is empty, returns 'None'
 * 
 * @param demons demons array
 * @returns string
 */
function getHardestDemon(demons) {
	let hardest = 'None';
	if (demons.length != 0) {
		let position = Number.MAX_SAFE_INTEGER;
		for (const demon of demons) {
			if (position > demon.position && demon.progress === 100) {
				position = demon.position;
				hardest  = demon.name + ' ' + resource.getTrophy('demon', demon.position);
			}
		}
	}
	return hardest;
}

/**
 * 
 * @param fields 
 * @param demon 
 * @param completed 
 */
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

/**
 * 
 * @param field_name
 * @param demons
 * @param completed
 * @returns 
 */
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

module.exports = {
	author,
	async getDemonEmbed(demon) {
		const demon_embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setAuthor(author)
			.setTitle(demon.name)
			.addFields(
				{ name: 'Position',     value: `${demon.position}`, inline: true },
				{ name: 'Publisher',    value: utils.getUserNameBanned(demon.publisher), inline: true },
				{ name: 'Verifier',     value: utils.getUserNameBanned(demon.verifier), inline: true },
				{ name: 'First Victor', value: await request.getFirstVictor(demon.position, true), inline: true },
				{ name: 'Level ID',     value: `${demon.level_id == null ? 'unknown' : demon.level_id}`, inline: true },
				{ name: '\u200B',       value: '\u200B', inline: true }
			)
			.setThumbnail(resource.getTrophy('extreme', demon.position))
			.setImage(demon.thumbnail)
			.setTimestamp()
			.setFooter({ text: `PointerBot` });

		const row = new ActionRowBuilder()
			
		const backButton = new ButtonBuilder()
			.setLabel('Open in Pointercrate')
			.setURL(`${urls.pointercrate}demonlist/permalink/${demon.id}`)
			.setStyle(ButtonStyle.Link)
		const followButton = new ButtonBuilder()
			.setLabel('Open Video')
			.setURL(`${demon.video}`)
			.setStyle(ButtonStyle.Link)
	
		row.addComponents(backButton, followButton);

		return { embeds: [demon_embed], components: [row] };
	},

	async getPlayerEmbed(player, demons) {
		let demon_embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setAuthor(author)
			.setTitle(player.name)
			.addFields(
				{ name: 'Demonlist rank',  value: `${player.rank} ${resource.getTrophy('player', player.rank)}`, inline: true },
				{ name: 'Demonlist score', value: player.score.toFixed(2), inline: true },
				{ name: 'Demonlist stats', value: getPlayerDemonsCompleted(demons), inline: true },
				{ name: 'Hardest demon',   value: getHardestDemon(demons), inline: true }
			)
			.setThumbnail(`https://flagcdn.com/h240/${player.nationality.country_code.toLowerCase()}.png`)
			.addFields(getFieldsDemons('Demons Completed', demons, true, false))
			.addFields(getFieldsDemons('Progress on', demons, false, false))
			.addFields(getFieldsDemons('Demons verified', demons, true, true))
			.setTimestamp()
			.setFooter({ text: `PointerBot` });
		return demon_embed;
	},

	async getDemonlistEmbed(demons, page, title, footer_text, legacy) {
		const row = new ActionRowBuilder()
			
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(page == 1)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled((!legacy && page == 3) || demons.length != 25)

		row.addComponents(backButton, followButton);

		let description = (() => {
			let lines = '';
			demons.forEach(element => {
				lines += `${`\`${`${element.position}`.padStart(3, '0')}\`` } - ${ element.name } \n`;
			});
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
	},

	getRankingEmbed(responseData, page) {
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
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(page === 1)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(responseData.data.length !== 25 || responseData.page.get('next') == undefined)

		row.addComponents(backButton, followButton);

		let description = (() => {
			let lines = '';
			responseData.data.forEach(player => {
				const country = player.nationality == null ? ':united_nations:' :
					`:flag_${player.nationality.country_code.toLowerCase()}:`

				lines += `${country} ${`\`${`${player.rank}`.padStart(3, '0')}\``} - **${player.name}** *${player.score.toFixed(2)}*\n`;
			});
			return lines;
		})();

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setAuthor(author)
			.setTitle('Leaderboard')
			.setDescription(description)
			.setFooter({ text: `Page ${ page }` })
			.setThumbnail('https://media.discordapp.net/attachments/1041217295743197225/1041217599016542298/extreme_demon.png')
			.setTimestamp()

		return { content: null, message: { embeds: [embed], components: [row] } }
	},

	getCountryEmbed(page) {
		const comboBox = new StringSelectMenuBuilder()
			.setCustomId('country')
			.setPlaceholder('Select a country');

		const sortCountry = countries.sort(function(a, b) {
			if (a.en_name.charCodeAt(0) < b.en_name.charCodeAt(0)) {
			  return -1;
			} else if (a.en_name.charCodeAt(0) > b.en_name.charCodeAt(0)) {
			  return 1;
			}
			return 0;
		  })
	
		let description = ''
		for (let i = 25 * (page - 1); i < sortCountry.length && i != (25 * (page)); i++) {
			description += `\`${`${i + 1}`.padStart(3, '0')}\` ${sortCountry[i].en_name}\n`
			let countryName = sortCountry[i].en_name;
			if (countryName.length > 25) {
				countryName = countryName.substring(0, 22).concat('...')
			}
	
			comboBox.addOptions(new StringSelectMenuOptionBuilder()
				.setLabel(countryName)
				.setValue(sortCountry[i].code)
			);
		}

		let comboboxComponent = new ActionRowBuilder();
		comboboxComponent.addComponents(comboBox);
	
		const row = new ActionRowBuilder()
	
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(page == 1)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled((25 * page) > sortCountry.length)
	
		row.addComponents(backButton, followButton);

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setAuthor(author)
			.setTitle('List of countries with stats')
			.setDescription(description)
			.setFooter({ text: `Page ${ page }` })
			//.setThumbnail('https://flagpedia.net/data/org/w580/un.png')
			.setThumbnail('https://media.discordapp.net/attachments/1041217295743197225/1041217599016542298/extreme_demon.png')
			.setTimestamp()
	
		return {
			content: 'Select one of the countries from the drop down menu',
			embeds: [embed],
			components: [comboboxComponent, row]
		}
	},

	getLeaderboardCountryEmbed(players, page, code, next) {
		const row = new ActionRowBuilder()
	
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(page === 0)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(utils.isNullOrUndefined(next))
		
		row.addComponents(backButton, followButton);

		let description = (() => {
			let lines = '';

			for (let i = 0, pos = (25 * page) + 1; i < players.length; i++, pos++) {
				const player = players[i];
				lines += `\`${`${pos}`.padStart(3, '0')}\` - **${player.name}** *${player.score.toFixed(2)}*\n`;
			}
			return lines;
		})();

		let footerText = `Page ${ page + 1 }`
		const player = players[0]
		if ('nationality' in player) {
			footerText = `${player.nationality.nation}  - ${footerText}`
		}

		const embed = new EmbedBuilder()
			.setAuthor(author)
			.setColor(EMBED_COLOR)
			.setTitle('Leaderboard')
			.setDescription(description)
			.setFooter({ text: footerText })
			.setThumbnail(`https://flagcdn.com/h240/${code}.png`)

		return { content: '', embeds: [embed], components: [row] }
	}
};