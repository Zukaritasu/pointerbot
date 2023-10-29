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

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const request = require('../request');
const embeds = require('../embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('The top 1 player of the leaderboad'),

	async execute(interaction) {
		if (interaction instanceof ChatInputCommandInteraction)
			await interaction.deferReply();
		const responseData = await request.getResponseJSON('api/v2/demons/listed?limit=1&after=0');

		let message;
		if (responseData.data.length === 0) {
			message = 'Pointercrate API: has returned an empty field'
		} else {
			message = await embeds.getDemonEmbed(interaction, responseData.data[0]);
		}

		if (interaction instanceof ChatInputCommandInteraction) {
			await interaction.editReply(message);
		} else {
			await interaction.reply(message);
		}
	}
};