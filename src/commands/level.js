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
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	Client,
	MessageComponentInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require('discord.js');

const request = require('../request');
const embedLevel = require('../embed-level');
const logger = require('../logger');
const errorMessages = require('../error-messages');
const utils = require('../utils');
const { Db } = require('mongodb');
const embeds = require('../embeds');

const COUNT_LIST_ELEMENTS = 15;
const FILTER_TIMEOUT = 120000; // 2 minutes




/**
 * Generates an embed message with a list of demons and navigation buttons.
 *
 * @param {Array} demons - The list of demon objects to display.
 * @param {number} begin - The starting index of the demons list to display.
 * @param {number} countDemons - The number of demons to display.
 * @returns {Object} An object containing the embed message and components.
 */
function getLevelListEmbed(demons, begin, countDemons) {
	let description = '';
	let countOptions = 0;

	const menu = new StringSelectMenuBuilder()
	menu.setCustomId('demon')
	menu.setPlaceholder('Select a demon')

	for (let i = begin; i < demons.length && i < begin + countDemons; i++) {
		const demon = demons[i];
		countOptions++;
		description += `\`${`${(i + 1)}`.padStart(2, '0')}\` - ${demon.name} *by ${demon.publisher.name}*\n`;
		menu.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(`${demon.name} by ${demon.publisher.name}`)
			.setValue(`${i}`)
		);
	}

	const isEmpty = countOptions === 0;

	return {
		embeds: [
			new EmbedBuilder()
				.setColor(embeds.COLOR)
				.setAuthor(embeds.author)
				.setTitle('Demons')
				.setDescription(description)
				.setTimestamp()
				.setFooter({ text: `PointerBot` })
		],
		components: [
			new ActionRowBuilder().addComponents(menu),
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('back')
					.setEmoji('<:retroceder:1320736997941317715>')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(isEmpty || begin < countDemons),
				new ButtonBuilder()
					.setCustomId('follow')
					.setEmoji('<:siguiente:1320749783505178725>')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(isEmpty || countOptions < countDemons || begin + countDemons >= demons.length),
				new ButtonBuilder()
					.setCustomId('close')
					.setEmoji('<:close:1320737181358227551>')
					.setStyle(ButtonStyle.Danger)
			)
		]
	}
}

/**
 * Fetches demon data from the API based on the provided value.
 *
 * @param {number|string} value - The value to query the API with. If a number is provided, it will fetch the demon
 *                                listed after the given number. If a string is provided, it will search for demons
 *                                whose names contain the given string.
 * @returns {Promise<Object>} A promise that resolves to an object containing the error status and the fetched data.
 *                            If an error occurs, the object will have an `error` property set to true. Otherwise,
 *                            it will have an `error` property set to false and a `data` property containing the
 *                            fetched demon data.
 */
async function getDemonJSON(value) {
	let query = (typeof value === 'number') ? `api/v2/demons/listed?limit=1&after=${--value}` :
		`api/v2/demons/?name_contains=${value.trim().toLowerCase().replace(' ', '+')}`;

	logger.DBG(`Querying Pointercrate API with: ${query}`)
	const responseData = await request.getResponseJSON(query);
	if (responseData instanceof Error) {
		return {
			error: true
		}
	} else {
		return {
			error: false,
			data: responseData.data
		}
	}
}


/**
 * Handles the interaction response message for a level command.
 * 
 * @param {ChatInputCommandInteraction} interaction - The interaction object from Discord.
 * @param {Object} demonJson - The JSON object containing demon data.
 * @returns {Promise<void>} - A promise that resolves when the interaction is complete.
 * 
 * @throws {Error} - Throws an error if there is an issue with the interaction.
 */
async function waitResponseMessage(interaction, demonJson) {
	let begin = 0,
		/** @type {MessageComponentInteraction} */
		confirmation = null,
		/** @type {{embeds: object[], components: object[]}} */
		message = null;

	let response = await interaction.editReply(message = getLevelListEmbed(demonJson.data, begin, COUNT_LIST_ELEMENTS));
	try {
		while (true) {
			const collectorFilter = i => i.user.id === interaction.user.id;
			confirmation = await response.awaitMessageComponent(
				{
					filter: collectorFilter,
					time: FILTER_TIMEOUT
				}
			);

			if (confirmation.customId === 'back') {
				begin -= COUNT_LIST_ELEMENTS;
			} else if (confirmation.customId === 'follow') {
				begin += COUNT_LIST_ELEMENTS;
			} else if (confirmation.customId === 'close') {
				await interaction.deleteReply(); break
			} else if (confirmation.customId === 'demon') {
				try {
					await confirmation.update(message = await embedLevel.getDemonEmbed(demonJson.data[parseInt(confirmation.values[0])]))
					confirmation = await response.awaitMessageComponent(
						{
							filter: collectorFilter,
							time: FILTER_TIMEOUT
						}
					);

					if (confirmation.customId === 'close')
						await interaction.deleteReply();
				} catch (e) {
					try {
						if (e.message !== errorMessages.InteractionCollectorErrorTime) {
							logger.ERR(e.message);
							await interaction.editReply('An error has occurred when querying the level')
						} else {
							// at 2 is close button
							message.components.at(0).components.at(2).setDisabled(true);
							await interaction.editReply({
								components: message.components,
								embeds: message.embeds
							});
						}
					} catch (err) {
						logger.ERR(err.message);
					}
				}
				break;
			}
			await confirmation.update(message = getLevelListEmbed(demonJson.data, begin, COUNT_LIST_ELEMENTS))
		}
	} catch (e) {
		try {
			if (e.message !== errorMessages.InteractionCollectorErrorTime) {
				logger.ERR(e.message);
				await interaction.editReply('An error has occurred when querying the level')
			} else
				await interaction.deleteReply();
		} catch (err) {
			logger.ERR(err.message);
		}
	}
}

/**
 * Handles the response message for a level query interaction.
 *
 * @param {Object} _serverInfo - The server information (currently unused).
 * @param {ChatInputCommandInteraction} interaction - The interaction object from the Discord API.
 * @param {string} option - The level name or position to query.
 * @returns {Promise<void>} - A promise that resolves when the response message has been handled.
 */
async function responseMessage(_serverInfo, interaction, option) {
	const demonJson = await getDemonJSON(option)
	if (demonJson.error || 'message' in demonJson.data /* response error */) {
		await interaction.editReply('Pointercrate API: an error has occurred when querying the level')
	} else if (demonJson.data.length === 1) {
		await utils.responseMessageAwaitClose(interaction, await embedLevel.getDemonEmbed(demonJson.data[0]));
	} else if (demonJson.data.length === 0) {
		await interaction.editReply('Pointercrate API: the name or position of the entered level does not exist')
	} else {
		await waitResponseMessage(interaction, demonJson)
	}
}

/**
 * Retrieves a user input option from the interaction object.
 * It first attempts to get a string option with the key 'name'.
 * If the string option is not provided, it then attempts to get an integer option with the key 'position'.
 * If the integer option is provided and is less than 0, it defaults to 1.
 *
 * @param {Object} interaction - The interaction object containing user input options.
 * @returns {string|number|null} - The user input option, which can be a string, a non-negative integer, or null if no valid option is provided.
 */
function getUserInputOption(interaction) {
	let option = interaction.options.getString('name', false);
	if (utils.isNullOrUndefined(option)) {
		option = interaction.options.getInteger('position', false)
		if (!utils.isNullOrUndefined(option) && option < 0) {
			option = 1; // numbers less than 0 are not valid
		}
	}
	return option;
}

/**
 * Executes the level command.
 *
 * @param {Client} _client - The client object (not used in this function).
 * @param {Db} database - The database object for accessing server information.
 * @param {ChatInputCommandInteraction} interaction - The interaction object representing the command interaction.
 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
 */
async function execute(_client, database, interaction) {
	await utils.validateServerInfo(interaction, database, false, false, async (serverInfo) => {
		const option = getUserInputOption(interaction);
		if (utils.isNullOrUndefined(option)) {
			await interaction.editReply(`You have not entered either of the two options. Enter a correct option`);
		} else {
			try {
				await responseMessage(serverInfo, interaction, option)
			} catch (e) {
				logger.ERR(e.message);
			}
		}
	})
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('level')
		.setDescription('Query a level by its position in the list or by its name')
		.addIntegerOption(option =>
			option.setName('position')
				.setDescription('The position of the demon, range 1 - 200'))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the demon')),
	execute
};