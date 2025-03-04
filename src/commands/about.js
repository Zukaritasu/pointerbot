// Copyright (C) 2023 - 2025 Zukaritasu
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

const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Client } = require('discord.js');

const botenv = require('../botenv');
const utils = require('../utils');
const tts = require('../translations');
const resource = require('../../resource.json');

/* ============================================================== */

/** 
 * @param {Client} _client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
	await utils.processServer(interaction, database, false, false, async (serverInfo) => {
		utils.responseMessageAwaitClose(interaction,
			{
				embeds: [botenv.getAboutEmbed(serverInfo.lang)],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel('Donate')
								.setURL(resource.urls.DONATIONS)
							.setStyle(ButtonStyle.Link),
						new ButtonBuilder()
							.setLabel('GitHub')
								.setURL('https://github.com/Zukaritasu/pointerbot')
							.setStyle(ButtonStyle.Link),
						new ButtonBuilder()
							.setStyle(ButtonStyle.Danger)
								.setEmoji(resource.emojis.id.closeicon)
							.setCustomId("close")
					)
				]
			}, false
		)
	})
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about the development of this bot'),
	execute
};