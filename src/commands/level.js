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
	Client
} = require('discord.js');

const request = require('../request');
const embed = require('../embeds');
const utils = require('../utils');
const { Db } = require('mongodb');

const COUNT_LIST_ELEMENTS = 15;

async function getDemonJSON(value) {
	let query = (typeof value === 'number') ? `api/v2/demons/listed?limit=1&after=${--value}` :
		`api/v2/demons/?name_contains=${value.trim().toLowerCase().replace(' ', '+')}`;
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
 * @param {ChatInputCommandInteraction} interaction 
 * @param {object} demonJson 
 */
async function waitResponseMessage(interaction, demonJson) {
	let begin = 0;
	let response = await interaction.editReply(embed.getLevelListEmbed(demonJson.data, begin, COUNT_LIST_ELEMENTS));
	try {
		while (true) {
			const collectorFilter = i => i.user.id === interaction.user.id;
			let confirmation = await response.awaitMessageComponent(
				{
					filter: collectorFilter,
					time: 60000
				}
			);

			if (confirmation.customId === 'back') {
				begin -= COUNT_LIST_ELEMENTS;
			} else if (confirmation.customId === 'follow') {
				begin += COUNT_LIST_ELEMENTS;
			} else if (confirmation.customId === 'demon') {
				await confirmation.update(await embed.getDemonEmbed(demonJson.data[parseInt(confirmation.values[0])]))
				break;
			}
			await confirmation.update(embed.getLevelListEmbed(demonJson.data, begin, COUNT_LIST_ELEMENTS))
		}
	} catch (e) {
		console.log(e)
		try {
			await interaction.editReply(
				{
					content: 'No player has been selected from the drop-down menu',
					embeds: [],
					components: []
				}
			);
		} catch (err) {

		}
	}
}

/**
 * Creates a request to the Pointercrate API waiting for a response and after
 * having obtained the response it goes through a verification of the data
 * and then calls the waitResponseMessage function.
 * 
 * @param {object} serverInfo 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {string | number} option 
 */
async function responseMessage(serverInfo, interaction, option) {
	let demonJson = await getDemonJSON(option)
	if (demonJson.error || 'message' in demonJson.data /* response error */) {
		await interaction.editReply('Pointercrate API: an error has occurred when querying the level')
	} else if (demonJson.data.length === 1) {
		await interaction.editReply(await embed.getDemonEmbed(demonJson.data[0]))
	} else if (demonJson.data.length === 0) {
		await interaction.editReply('Pointercrate API: the name or position of the entered level does not exist')
	} else {
		await waitResponseMessage(interaction, demonJson)
	}
}

/**
 * Returns one of the two options entered by the user, which can be either
 * the name of the level or its position in the demonlist. In any case that
 * the user did not enter any value, the function returns null
 * 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns {string | number | null}
 */
async function getUserInputOption(interaction) {
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
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
	await utils.validateServerInfo(interaction, database, false, false, async (serverInfo) => {
		const option = await getUserInputOption(interaction);
		if (utils.isNullOrUndefined(option)) {
			await interaction.reply(`You have not entered either of the two options. Enter a correct option`);
		} else {
			try {
				await responseMessage(serverInfo, interaction, option)
			} catch (e) {
				console.log(e)
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