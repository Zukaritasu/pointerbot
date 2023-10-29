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
const embed = require('../embeds');

/**
 * 
 * @param {*} object 
 */
async function replyMessage(interaction, object) {
	if (interaction instanceof ChatInputCommandInteraction) {
		await interaction.editReply(object);
	} else {
		await interaction.reply(object);
	}
}

/**
 * 
 * @param {*} interaction 
 * @param {*} pos 
 */
async function getJSONByPosition(interaction, pos) {
	if (!(pos > 0 && pos <= 445))
		await replyMessage(interaction, `Interaction error: the entered position '${ pos }' is outside the range 1 - 445`);
	else {
		let responseData = await request.getResponseJSON(`api/v2/demons/listed?limit=1&after=${ --pos }`);
		if (responseData.data.length == 0)
			await replyMessage(interaction, `The level does not exist in Pointercrate or is not registered`);
		else
			return responseData.data[0];
	}
	return null;
}

/**
 * 
 * @param {*} interaction 
 * @param {*} name 
 * @returns 
 */
async function getJSONByName(interaction, name) {
	const demon_name = name.trim().toLowerCase();
	const responseData = await request.getResponseJSON(`api/v2/demons/?name_contains=${ demon_name.replace(' ', '+') }`);
	if (responseData.data.length == 0) {
		await replyMessage(interaction, `The level does not exist in Pointercrate or is not registered`);
	} else {
		for (const demon of responseData.data) {
			if (demon.name.toLowerCase() == demon_name) {
				return demon;
			}
		}
	}
	return null;
}

/**
 * 
 * @param {*} interaction 
 * @param {*} args 
 */
async function getUserInputOption(interaction, args) {
	let option = null;
	if (!(interaction instanceof ChatInputCommandInteraction)) {
		if (args.length > 1 && isNaN((option = parseInt(args[1][1])))) {
			option = args[1][1] + ' ';
			for (let i = 2; i < args[1].length; i++)
				option += args[1][i];
			option = option.trim();
		}
	} else {
		option = interaction.options.getString('name', false);
		if (option == null) {
			option = interaction.options.getInteger('position', false);
		}
	}
	return option;
}

/**
 * 
 * @param {*} interaction 
 */
async function execute(interaction) {
	try {
		const option = await getUserInputOption(interaction, arguments);
		if (option == null) {
			await interaction.reply(`Interaction error: No option entered`);
		} else {
			if (interaction instanceof ChatInputCommandInteraction)
				await interaction.deferReply();
			const demon_json = (typeof option != 'number')  ? 
			await getJSONByName(interaction, option) : await getJSONByPosition(interaction, option);
			if (demon_json != null) {
				await replyMessage(interaction, await embed.getDemonEmbed(interaction, demon_json));
			}
		}
	} catch (error) {
		await replyMessage(interaction, `\`\`\`Internal error: \n${ error }\`\`\``);
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