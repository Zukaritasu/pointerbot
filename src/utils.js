/**
 * Copyright (C) 2022-2026 Zukaritasu
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

// @ts-check

const { Db } = require('mongodb');
const server = require('./server');
const logger = require('./logger');
const tts = require('./translations');
const { ChatInputCommandInteraction, ButtonStyle, MessageFlags,
	MessageComponentInteraction, DiscordjsErrorCodes, Embed,
	ActionRowBuilder } = require('discord.js');
const { ButtonBuilder } = require('@discordjs/builders');

/**
 * @typedef {object} MessagePayloadOptions
 * @property {Embed[]} [embeds]
 * @property {ActionRowBuilder<any>[]} [components]
 * @property {string} [content]
 */

module.exports = {
	/**
	 * Returns the text with a dash in the middle indicating that the user is banned.
	 * 
	 * @param {{name: string, banned: boolean}} user - user name and banned status
	 * @returns {string} user name formatted
	 */
	getUserNameBanned(user) {
		return user.banned ? `__${user.name}__` : user.name;
	},

	/**
	 * Returns a text with a different style depending on the position in the list,
	 * top 75 (bold style), top 150 italic style, legacy list (normal text)
	 * 
	 * @param {string} text - text to which the style will be applied according to position
	 * @param {number} position - position on the demonlist
	 * @returns {string} styled text
	 */
	getTextStyleByPosition(text, position) {
		return position <= 75 ? `**${text}**` : position > 150 ? text : `*${text}*`;
	},

	/**
	 * Checks if a value is null or undefined.
	 * @param {*} value - The value to check.
	 * @returns {boolean} - True if the value is null or undefined, false otherwise.
	 */
	isNullOrUndefined(value) {
		return value == null || value == undefined;
	},

	/**
	 * This function processes a server-related interaction by checking user permissions
	 * and retrieving server information from the database.
	 * 
	 * @param {ChatInputCommandInteraction} interaction - The interaction object from Discord.js
	 * @param {Db} database - The MongoDB database instance
	 * @param {boolean} ephemeral - Whether the reply should be ephemeral
	 * @param {boolean} usePermissions - Whether to check for admin or owner permissions
	 * @param {function(import('./server').ServerInfo)} func - The function to execute with
	 * the server information
	 */
	async processServer(interaction, database, ephemeral, usePermissions, func) {
		try {
			await interaction.deferReply({
				flags: ephemeral ? MessageFlags.Ephemeral : undefined
			});
			if (usePermissions && !server.isAdminOrOwner(interaction)) {
				await interaction.editReply('You do not have sufficient privileges to perform this action');
			} else if (interaction.inGuild()) {
				const serverInfo = await server.getServerInfo(database, interaction.guildId)
				if (serverInfo === null) {
					await interaction.editReply({
						content: 'Server information not found.'
					});
				} else {
					await func(serverInfo)
				}
			}
		} catch (error) {
			logger.ERR(error);
		}
	},

	/**
	 * Sends a response message to the interaction and waits for the user to confirm closing it.
	 * If the user confirms, the message is deleted. If an error occurs, it is logged and an 
	 * error message is sent.
	 * 
	 * @param {ChatInputCommandInteraction} interaction - The interaction object from Discord.js.
	 * @param {MessagePayloadOptions} message - The message to send as a response.
	 * @param {boolean} autodelete - Whether to automatically delete the message after timeout.
	 * @param {string} lang - The language code for translations.
	 * @returns {Promise<void>} - A promise that resolves when the interaction reply is sent and handled.
	 */
	async responseMessageAwaitClose(interaction, message, autodelete = true, lang = 'english') {
		try {
			let response = await interaction.editReply(message)

			const collectorFilter = ( /** @type {MessageComponentInteraction} */ i) =>
				i.user.id === interaction.user.id;
			let confirmation = await response.awaitMessageComponent(
				{
					filter: collectorFilter,
					time: 300000 // 5 min
				}
			);

			if (confirmation.customId === 'close') {
				await interaction.deleteReply();
			}
		} catch ( /** @type {any} */ e) {
			try {

				if (!('code' in e) || e.code !== DiscordjsErrorCodes.InteractionCollectorError) {
					logger.ERR(e.message);
					await interaction.editReply(tts.getTranslation(lang, 'err_unknown'))
				} else if (autodelete) {
					await interaction.deleteReply();
				} else {
					message.components?.at(0)?.components.forEach(button => {
						if (button instanceof ButtonBuilder) {
							if (button.toJSON().style !== ButtonStyle.Link) {
								button.setDisabled(true)
							}
						}
					})

					await interaction.editReply(message);
				}
			} catch (err) {
				logger.ERR(err);
			}
		}
	}
};