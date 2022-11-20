// Copyright (C) 2022 Zukaritasu
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const request = require('../request');
const embed = require('../embeds');

/**
 * Get basic info player
 * @param {*} name 
 */
async function getPlayerJSON(name) {
	const players_json = await request.getJSON(`api/v1/players/ranking/?name_contains=${ name.replace(' ', '+') }`);
	for (const player_json of players_json) {
		if (player_json.name.toLowerCase() == name) {
			return player_json;
		}
	}
	return null;
}

/**
 * 
 * @param {*} interaction 
 */
async function execute(interaction) {
	try {
		let player = interaction.options.getString('name', false);
		if (player == null) {
			await interaction.reply(`Interaction error: No option entered`);
		} else {
			await interaction.deferReply();
			const player_json = await getPlayerJSON(player.toLowerCase().trim());
			if (player_json == null) {
				await interaction.editReply('Pointercrate API: player does not exist');
			} else {
				await interaction.editReply({ embeds: [await embed.getPlayerEmbed(player_json, await request.getPlayerAllProgress(player_json.id))] });
			}
		}
	} catch (error) {
		console.log(error);
		await interaction.editReply(`Internal error: ${ error.message }`);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('Check the stats of a player who is registered in Pointercrate')
		.addStringOption(option =>
			option.setName('name')
				  .setDescription('The name of the player')
				  .setRequired(true)
		),
		execute
};