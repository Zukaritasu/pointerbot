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
	ChatInputCommandInteraction
} = require('discord.js');

const request = require('../request');
const embed = require('../embeds');
const utils = require('../utils');

const COUNT_LIST_ELEMENTS = 15;

/**
 * 
 * @param {ChatInputCommandInteraction} interaction
 * @param {array} players
 * @returns object
 */
async function waitUserResponse(interaction, players) {
	let begin = 0;
	let response = await interaction.editReply(embed.getPlayerListEmbed(players, begin, COUNT_LIST_ELEMENTS));
	while (true) {
		const collectorFilter = i => i.user.id === interaction.user.id;
		let confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });

		if (confirmation.customId === 'back') {
			begin -= COUNT_LIST_ELEMENTS;
		} else if (confirmation.customId === 'follow') {
			begin += COUNT_LIST_ELEMENTS;
		} else if (confirmation.customId === 'player') {
			for (let i = 0; i < players.length; i++) {
				if (players[i].name === confirmation.values[0]) {
					return { reply: confirmation, player: players[i], message: null };
				}
			}
		}
		await confirmation.update(embed.getPlayerListEmbed(players, begin, COUNT_LIST_ELEMENTS))
	}
}

/**
 * Get basic info player
 * @param {*} name 
 */
async function getPlayerByName(interaction, name) {
	const responseData = await request.getResponseJSON(`api/v1/players/ranking/?name_contains=${name.replace(' ', '+')}`);
	const players = responseData.data;

	if ('length' in players && players.length != 0) {
		if (players.length === 1)
			return { reply: null, player: players[0], message: null };
		try {
			return await waitUserResponse(interaction, players)
		} catch (e) {
			console.log(e)
			return { message: 'No player has been selected from the drop-down menu' };
		}
	}

	return { message: 'Pointercrate API: player does not exist' };
}

/**
 * 
 * @param {*} interaction 
 */
async function execute(_client, database, interaction) {
	await utils.validateServerInfo(interaction, database, false, false, async (_serverInfo) => {
		try {
			let player = interaction.options.getString('name', false);
			if (player === null) {
				await interaction.editReply(`Interaction error: No option entered`);
			} else {
				const confirm = await getPlayerByName(interaction, player.toLowerCase().trim());
				if (confirm.message !== null) { // user does not exist or invalid selection
					await interaction.editReply(
						{ 
							content: confirm.message, 
							embeds: [], 
							components: [] 
						});
				} else {
					const playerEmbed = [
						await embed.getPlayerEmbed(confirm.player, 
						await request.getPlayerAllProgress(confirm.player.id))
					]
					if (confirm.reply !== null) {
						await confirm.reply.update({ embeds: playerEmbed, components: [] });
					} else {
						await interaction.editReply({ embeds: playerEmbed });
					}
				}
			}
		} catch (e) {
			console.log(e);
			try {
				await interaction.editReply(`Internal error: ${e.message}`);
			} catch (err) {

			}
		}
	})
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('Check the stats of a player who is registered in Pointercrate')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the player')
				.setRequired(true)),
	execute
};