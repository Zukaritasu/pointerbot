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
const embeds = require('../embeds');

/**
 * 
 * @param {*} object 
 */
async function printMessage(interaction, object) {
	if (interaction instanceof ChatInputCommandInteraction) {
		await interaction.editReply(object);
	} else {
		await interaction.reply(object);
	}
}

/**
 * 
 * @param {*} interaction 
 */
async function execute(interaction) {
	if (interaction instanceof ChatInputCommandInteraction)
		await interaction.deferReply();
	const json = await request.getJSON('api/v2/demons/listed?limit=1&after=0');
	if (json.length != 0) {
		await printMessage(interaction, { embeds: [await embeds.getDemonEmbed(interaction, json[0])] });
	} else {
		await printMessage(interaction, 'Pointercrate API has returned an empty field');
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('Show top 1'),
	execute
};