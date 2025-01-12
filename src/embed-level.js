/**
 * Copyright (C) 2022-2024 Zukaritasu
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

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const request = require('./request');
const resource = require('./resource');
const embeds = require('./embeds');
const utils = require('./utils');
const axios = require('axios');
const { urls, emojis } = require('../resource.json');

//////////////////////////////////////////////////////////////

//----------------------------------------------------------//


/**
 * Fetches the thumbnail URL for a given YouTube video ID.
 * 
 * This function attempts to retrieve the medium quality (mqdefault) thumbnail.
 * If the request fails, it falls back to the high quality (hqdefault) thumbnail.
 * 
 * @param {string} videoId - The ID of the YouTube video.
 * @returns {Promise<string>} - A promise that resolves to the thumbnail URL.
 */
async function getThumbnail(videoId) {
	try {
		await axios.get(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
		return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
	} catch (error) {
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}
}

/**
 * Retrieves video information for a given demon.
 *
 * @param {Object} demon - The demon object containing video and thumbnail information.
 * @returns {Promise<Object>} An object containing the video link and thumbnail URL.
 */
async function getVideoInfo(demon) {
    const info = {
        link: demon.video,
        thumbnail: demon.thumbnail
    };

    if (!info.link) {
        const victor = await request.getFirstVictorInfo(demon.position);
        const videoId = victor ? victor.video.split('v=')[1].split('&')[0] : 'dQw4w9WgXcQ';
        info.link = victor ? victor.video : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        info.thumbnail = await getThumbnail(videoId);
    }

    return info;
}

/**
 * Generates an embed message for a given demon with detailed information.
 *
 * @param {Object} demon - The demon object containing information about the demon.
 * @returns {Promise<{ embeds: object[], components: []}>} A promise that resolves to an object containing the embed message and components.
 */
async function getDemonEmbed(demon) {
	const videoInfo = await getVideoInfo(demon);

	const embed = new EmbedBuilder()
	embed.setColor(embeds.COLOR)
	embed.setAuthor(embeds.author)
	embed.setTitle(demon.name)
		.addFields(
			{ name: 'Position', value: `${demon.position}`, inline: true },
			{ name: 'Publisher', value: utils.getUserNameBanned(demon.publisher), inline: true },
			{ name: 'Verifier', value: utils.getUserNameBanned(demon.verifier), inline: true },
			{ name: 'First Victor', value: await request.getFirstVictor(demon.position, true), inline: true },
			{ name: 'Level ID', value: `${demon.level_id == null ? 'unknown' : demon.level_id}`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true }
		)

	embed.setThumbnail(resource.getDemonImageClassification(
		await request.getLevelClassification(demon.level_id)))
	embed.setImage(videoInfo.thumbnail)
	embed.setTimestamp()
	embed.setFooter({ text: `PointerBot` });

	return {
		embeds: [embed],
		components: [
			new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setLabel('Pointercrate')
							.setURL(`${urls.pointercrate}demonlist/permalink/${demon.id}`)
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setLabel('Video')
							.setURL(`${videoInfo.link}`)
						.setStyle(ButtonStyle.Link),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Danger)
							.setEmoji(emojis.id.closeicon)
						.setCustomId("close")
				)
		]
	};
}

module.exports = {
	getDemonEmbed
}