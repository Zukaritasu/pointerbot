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
	EmbedBuilder, 
	StringSelectMenuBuilder, 
	StringSelectMenuOptionBuilder, 
	ActionRowBuilder, 
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction
} = require('discord.js');

const request = require('../request');
const embed = require('../embeds');

const COUNT_LIST_ELEMENTS = 15;

function getPlayerPosition(pos) {
	return `\`${`${pos}`.padStart(2, '0') }\``
}


function getListEmbed(players_json, begin) {
	let description = '';
	let list_count = 0;

	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('player')
		.setPlaceholder('Select a player')

	for (let i = begin; i < players_json.length && i < begin + COUNT_LIST_ELEMENTS; i++) {
		const player = players_json[i];
		list_count++;
		description += `${ getPlayerPosition(i + 1) } - ${ player.name } *score ${ player.score.toFixed(2) }*\n`;
		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(player.name)
			.setValue(player.name)
		);
	}

	const playerListEmbed = new EmbedBuilder()
		.setColor(0x2F3136)
		.setAuthor(embed.author)
		.setTitle('Players')
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: `PointerBot` });

	let buttonsComponent = new ActionRowBuilder();
	if (players_json.length > COUNT_LIST_ELEMENTS) {
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(begin < COUNT_LIST_ELEMENTS)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(list_count < COUNT_LIST_ELEMENTS || begin + COUNT_LIST_ELEMENTS >= players_json.length)

		buttonsComponent.addComponents(backButton, followButton);
	}
		
	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	return  buttonsComponent.components.length == 0 ? 
	{ 
		embeds: [playerListEmbed], 
		components: [comboboxComponent] 
	} :
	{ 
		embeds: [playerListEmbed], 
		components: [buttonsComponent, comboboxComponent] 
	}
}

/**
 * 
 * @param {any} interaction
 * @param {any} players
 * @returns
 */
async function waitUserResponse(interaction, players) {
	let begin = 0;
	let response = await interaction.editReply(getListEmbed(players, begin));
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
		await confirmation.update(getListEmbed(players, begin))
	}
}

/**
 * Get basic info player
 * @param {*} name 
 */
async function getPlayerForNameJSON(interaction, name) {
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
async function execute(interaction) {
	try {
		let player = interaction.options.getString('name', false);
		if (player == null) {
			await interaction.reply(`Interaction error: No option entered`);
		} else {
			if (interaction instanceof ChatInputCommandInteraction)
				await interaction.deferReply();
			const confirm = await getPlayerForNameJSON(interaction, player.toLowerCase().trim());
			if (confirm.message != null) {
				await interaction.editReply({ content: confirm.message, embeds: [], components: [] });
			} else {
				const playerEmbed = [
					await embed.getPlayerEmbed(confirm.player, await request.getPlayerAllProgress(confirm.player.id))
				]
				if (confirm.reply != null) {
					await confirm.reply.update({ embeds: playerEmbed, components: [] });
				} else {
					await interaction.editReply({ embeds: playerEmbed });
				}
			}
		}
	} catch (e) {
		console.log(e);
		try {
			await interaction.editReply(`Internal error: ${ e.message }`);
		} catch (err) {
			
		}
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