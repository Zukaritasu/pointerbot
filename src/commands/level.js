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
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require('discord.js');

const request = require('../request');
const embed = require('../embeds');
const utils = require('../utils');

const COUNT_LIST_ELEMENTS = 15;

function getDemonPosition(pos) {
	return `\`${`${pos}`.padStart(2, '0')}\``
}

function getListEmbed(demons, begin) {
	let description = '';
	let list_count = 0;

	const comboBox = new StringSelectMenuBuilder()
		.setCustomId('demon')
		.setPlaceholder('Select a demon')

	for (let i = begin; i < demons.length && i < begin + COUNT_LIST_ELEMENTS; i++) {
		const demon = demons[i];
		list_count++;
		description += `${getDemonPosition(i + 1)} - ${demon.name} *by ${demon.publisher.name}*\n`;
		comboBox.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(`${demon.name} by ${demon.publisher.name}`)
			.setValue(`${i}`)
		);
	}

	const listEmbed = new EmbedBuilder()
		.setColor(0x2F3136)
		.setAuthor(embed.author)
		.setTitle('Demons')
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: `PointerBot` });

	let buttonsComponent = new ActionRowBuilder();
	if (demons.length > COUNT_LIST_ELEMENTS) {
		const backButton = new ButtonBuilder()
			.setCustomId('back')
			.setLabel('←')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(begin < COUNT_LIST_ELEMENTS)
		const followButton = new ButtonBuilder()
			.setCustomId('follow')
			.setLabel('→')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(list_count < COUNT_LIST_ELEMENTS || begin + COUNT_LIST_ELEMENTS >= demons.length)

		buttonsComponent.addComponents(backButton, followButton);
	}

	let comboboxComponent = new ActionRowBuilder();
	comboboxComponent.addComponents(comboBox);

	return buttonsComponent.components.length == 0 ?
		{
			embeds: [listEmbed],
			components: [comboboxComponent]
		} :
		{
			embeds: [listEmbed],
			components: [buttonsComponent, comboboxComponent]
		}
}

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

async function waitResponseMessage(interaction, demonJson) {
	let begin = 0;
	let response = await interaction.editReply(getListEmbed(demonJson.data, begin));
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
			await confirmation.update(getListEmbed(demonJson.data, begin))
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

async function responseMessage(interaction, option) {
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

async function getUserInputOption(interaction) {
	let option = interaction.options.getString('name', false);
	if (utils.isNullOrUndefined(option)) {
		option = interaction.options.getInteger('position', false)
		if (!utils.isNullOrUndefined(option) && option < 0) {
			option = 1;
		}
	}
	return option;
}

async function execute(interaction) {
	const option = await getUserInputOption(interaction);
	if (utils.isNullOrUndefined(option)) {
		await interaction.reply(`You have not entered either of the two options. Enter a correct option`);
	} else {
		try {
			if (interaction instanceof ChatInputCommandInteraction)
				await interaction.deferReply();
			await responseMessage(interaction, option)
		} catch (e) {
			console.log(e)
		}
	}
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