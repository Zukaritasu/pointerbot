// Copyright (C) 2022 - 2025 Zukaritasu
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

const { SlashCommandBuilder, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const botenv = require('../botenv');
const fs = require('node:fs');
const path = require('node:path');
const utils = require('../utils');
const logger = require('../logger');
const tts = require('../translations');
const { Db } = require('mongodb');
const errorMessages = require('../error-messages');

/* ============================================================== */

const MAX_TIMEOUT = 180000 // 3 min

/** 
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
	await utils.processServer(interaction, database, false, false, async (serverInfo) => {
		try {
			const filePaths = tts.getHelpElementsTranslation(serverInfo.lang)
			if (filePaths.length === 0) {
				await interaction.editReply('An unknown error has occurred');
			} else {
				const buttons = [
					new ButtonBuilder()
						.setCustomId('back')
						.setEmoji('<:retroceder:1320736997941317715>')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('follow')
						.setEmoji('<:siguiente:1320749783505178725>')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('close')
						.setEmoji('<:close:1320737181358227551>')
						.setStyle(ButtonStyle.Danger)
				]

				const message = {
					embeds: [null],
					components: [
						new ActionRowBuilder().addComponents(
							buttons
						)
					]
				}

				const configureMessage = (index) => {
					buttons[0].setDisabled(index - 1 < 0)
					buttons[1].setDisabled(index + 1 == filePaths.length)
					message.embeds[0] = require(filePaths[index])
				}

				const collectorFilter = i => i.user.id === interaction.user.id;
				let index = 0, confirmation = interaction, response = null
				while (true) {
					configureMessage(index)

					const funcReply = confirmation instanceof ChatInputCommandInteraction ? interaction.editReply.bind(interaction) :
						confirmation.update.bind(confirmation);
					response = await funcReply(message)

					try {
						confirmation = await response.awaitMessageComponent(
							{
								filter: collectorFilter,
								time: MAX_TIMEOUT
							});

						if (confirmation.customId === 'back') {
							index--
						} else if (confirmation.customId === 'follow') {
							index++
						} else {
							await response.delete(); break;
						}
					} catch (error) {
						if (error.message !== errorMessages.InteractionCollectorErrorTime) {
							logger.ERR(e);
						} else {
							buttons.forEach(button => button.setDisabled(true))
							await interaction.editReply(message)
						}
					}
				}
			}
		} catch (error) {
			logger.ERR(error)
		}
	})
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Show the help of this bot'),
	execute
};