/**
 * Copyright (C) 2022-2025 Zukaritasu
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

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const request = require('../request');
const embedLevel = require('../embed-level');
const utils = require('../utils');
const logger = require('../logger')

//////////////////////////////////////////////////////////////

//----------------------------------------------------------//
//                         Demonlist                        //


/**
 * Fetches the top demon from the Pointercrate API and sends an embedded message with the demon's details.
 * If the API returns an empty field, sends a message indicating that.
 * If an error occurs, logs the error and sends an error message to the interaction.
 *
 * @param {ChatInputCommandInteraction} interaction - The interaction object from Discord.js.
 * @returns {Promise<void>} - A promise that resolves when the interaction reply is sent.
 */
async function demonlistTopLevel(interaction) {
	try {
		const responseData = await request.getResponseJSON('api/v2/demons/listed?limit=1&after=0')
		if (!responseData) {
			await interaction.editReply('Pointercrate API: has returned an empty field')
			return
		}

		await utils.responseMessageAwaitClose(interaction, 
			await embedLevel.getDemonEmbed(responseData.data[0]));
	} catch (e) {
		logger.ERR(e)
		try {
			await interaction.editReply('An unknown error has occurred')
		} catch (error) {
			logger.ERR('Error sending reply')
		}
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('Demonlist Top 1 Level'),

	async execute(_client, database, interaction) {
		await utils.processServer(interaction, database, false, false, async (_serverInfo) => {
			await demonlistTopLevel(interaction)
		})
	}
};