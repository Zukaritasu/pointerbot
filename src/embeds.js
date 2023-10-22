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

const { EmbedBuilder, APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const resource = require('./resource');
const request = require('./request');
const utils = require('./utils');
const { urls, emojis } = require('../resource.json');


const author = {
	name: 'Demonlist',
	iconURL: urls.demonlist_icon
};

/**
 * From an array of user demons the function returns an array of
 * 100% completed demons.
 * 
 * @param demons array of demons
 * @returns completed daemons
 */
function getDemonsCompleted(demons) {
	if (demons.length == 0)
		return 'None';

	const completed = demons.filter(demon => demon.progress === 100)
		.map(demon => demon.name)
		.join(' - ');
	return completed || 'None';
}

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
	if (demons.length == 0)
		return 'None';
	let hardest = { name: null, position: Number.MAX_SAFE_INTEGER };
	for (const demon of demons) {
		if (demon.position < hardest.position) {
			hardest = { name: demon.name + ' ' + resource.getTrophy('demon', demon.position), position: demon.position };
		}
	}
	return hardest.name;
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
		/* a new field is added */
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
function getFieldsDemons(field_name, demons, completed) {
	if (demons.length == 0)
		return { name: field_name, value: 'None' };
	let fields = [{ name: field_name, value: '' }];
	for (const demon of demons) {
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


module.exports = {
	async getDemonEmbed(msg, demon) {
		const demon_embed = new EmbedBuilder()
			.setColor(0x2F3136)
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
			.addFields({ name: '\u200B', value: `[Open in Pointercrate :arrow_upper_right:](${urls.pointercrate}demonlist/permalink/${demon.id}/)\n[Open Video :arrow_upper_right:](${demon.video})` })
			.setImage(demon.thumbnail)
			.setTimestamp()
			.setFooter({ text: `Pointercrate` });
		return demon_embed;
	},

	async getPlayerEmbed(player, demons) {
		let demon_embed = new EmbedBuilder()
			.setColor(0x2F3136)
			.setAuthor(author)
			.setTitle(player.name)
			.addFields(
				{ name: 'Demonlist rank',  value: `${player.rank} ${resource.getTrophy('player', player.rank)}`, inline: true },
				{ name: 'Demonlist score', value: player.score.toFixed(2), inline: true },
				{ name: 'Demonlist stats', value: getPlayerDemonsCompleted(demons), inline: true },
				{ name: 'Hardest demon',   value: getHardestDemon(demons), inline: true }
			)
			.setThumbnail(`https://flagcdn.com/h240/${player.nationality.country_code.toLowerCase()}.png`)
			.addFields(getFieldsDemons('Demons Completed', demons, true))
			.addFields(getFieldsDemons('Progress on', demons, false))
			.setTimestamp()
			.setFooter({ text: `Pointercrate` });
		return demon_embed;
	},

	async getDemonlistEmbed(demons) {
		const row = new ActionRowBuilder();

		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary);
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary);

		row.addComponents(backButton, followButton);

		const embed = new EmbedBuilder()
			.setTitle('Título del embed')
			.setDescription('Descripción del embed');

		return { embeds: [embed], components: [row] };
	}
};