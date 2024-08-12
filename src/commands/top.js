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

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const request = require('../request');
const embeds = require('../embeds');
const utils = require('../utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('The top 1 player of the leaderboad'),

	async execute(_client, database, interaction) {
		await utils.validateServerInfo(interaction, database, false, false, async (_serverInfo) => {
			const responseData = await request.getResponseJSON('api/v2/demons/listed?limit=1&after=0')
			const message = responseData.data.length === 0 ? 'Pointercrate API: has returned an empty field' : 
				await embeds.getDemonEmbed(responseData.data[0])
			await utils.responseMessageAwaitClose(interaction, message)
		})
	}
};