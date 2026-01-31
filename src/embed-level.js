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

// @ts-check

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const request = require('./request');
const resource = require('./resource');
const embeds = require('./embeds');
const utils = require('./utils');
const axios = require('axios');
const { urls, emojis } = require('../resource.json');

/**
 * @typedef {object} DemonUser
 * @property {number} id - Unique identifier of the user.
 * @property {string} name - Display name of the user.
 * @property {boolean} banned - Whether the user is banned from the list.
 */

/**
 * @typedef {object} DemonNationality
 * @property {string} nation - Full name of the country.
 * @property {string} country_code - ISO country code.
 * @property {string|null} subdivision - Region or state subdivision if applicable.
 */

/**
 * @typedef {object} DemonRecord
 * @property {number} id - Unique identifier of the record.
 * @property {number} progress - Completion percentage (0-100).
 * @property {string} status - Current status of the record (e.g., 'approved').
 * @property {string} video - URL to the proof video.
 * @property {DemonUser} player - Information about the player who achieved the record.
 * @property {DemonNationality?} nationality - Geographical location of the record.
 */

/**
 * @typedef {object} Demon
 * @property {number} id - Internal database ID of the demon.
 * @property {number} level_id - The official Geometry Dash level ID.
 * @property {string} name - Name of the level.
 * @property {number} position - Rank position on the demonlist.
 * @property {number} requirement - Minimum percentage required to submit a record.
 * @property {string} thumbnail - URL of the level's thumbnail image.
 * @property {string} video - URL of the level's showcase or verification video.
 * @property {DemonUser} publisher - User who published the level.
 * @property {DemonUser} verifier - User who verified the level.
 * @property {DemonUser[]} creators - List of creators involved in the level.
 * @property {DemonRecord[]} records - List of approved records for this level.
 */

/**
 * Fetches the most appropriate thumbnail URL for a given YouTube video ID.
 * It prioritizes the medium quality (mqdefault) thumbnail by performing a 
 * HEAD/GET request to verify its existence. If the medium quality is 
 * unavailable, it falls back to the high quality (hqdefault) version.
 * 
 * @param {string} videoId - The unique identifier of the YouTube video.
 * @returns {Promise<string>} A promise that resolves to the verified or fallback thumbnail URL.
 * @throws {Error} Might throw an error if the network request fails completely.
 */
async function getThumbnail(videoId) {
	try {
		// We use axios to check if the specific quality exists
		await axios.get(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
		return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
	} catch (error) {
		// Fallback to high quality if medium is not found
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}
}

/**
 * Retrieves the video link and thumbnail for a specific demon.
 * If the demon object lacks a direct video link, the function attempts to fetch 
 * the video from the first recorded victor. If no victor video is found, 
 * it defaults to a fallback video and its corresponding thumbnail.
 * 
 * @param {Demon} demon - The demon object containing level and media information.
 * @returns {Promise<{link: string, thumbnail: string}>} An object containing the
 * video URL and the thumbnail URL.
 */
async function getVideoInfo(demon) {
	const info = {
		link: demon.video,
		thumbnail: demon.thumbnail
	};

	if (!info.link) {
		// Attempt to fetch video from the first person who beat the level
		const victor = await request.getFirstVictorInfo(demon.position);

		// Extract YouTube ID or use fallback ID (Rick Astley)
		const videoId = victor
			? victor.video.split('v=')[1].split('&')[0]
			: 'dQw4w9WgXcQ';

		info.link = victor
			? victor.video
			: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		// Get the thumbnail (verified or fallback) using the extracted ID
		info.thumbnail = await getThumbnail(videoId);
	}

	return info;
}

/**
 * Generates a detailed Discord embed and action row for a specific demon.
 * * This function aggregates data from multiple sources:
 * - Video and thumbnail info via {@link getVideoInfo}.
 * - Demonlist status (position, publisher, verifier).
 * - External level classification for the difficulty icon.
 * - Social and utility buttons (Pointercrate link, Video link, and Close button).
 * * @param {Demon} demon - The demon object containing all list and level metadata.
 * 
 * @returns {Promise<{ embeds: EmbedBuilder[], components: ActionRowBuilder[] }>} 
 * A promise that resolves to the message payload containing the embed and components.
 * @throws {Error} If the level classification cannot be retrieved.
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

	const classification = await request.getLevelClassification(demon.level_id)
	if (!classification) {
		throw new Error('classification is null')
	}

	embed.setThumbnail(resource.getDemonImageClassification(classification))
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