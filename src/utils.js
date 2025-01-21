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

const { Db } = require('mongodb');
const server = require('./server');
const logger = require('./logger');
const errorMessages = require('./error-messages');
const tts = require('./translations');
const { ChatInputCommandInteraction, Message, ButtonStyle } = require('discord.js');

module.exports = {
	/**
	 * Returns the text with a dash in the middle indicating that the user is banned.
	 * 
	 * @param user user name
	 * @returns text
	 */
	getUserNameBanned(user) {
		return user.banned ? `__${user.name}__` : user.name;
	},

	/**
	 * Returns a text with a different style depending on the position in the list,
	 * top 75 (bold style), top 150 italic style, legacy list (normal text)
	 * 
	 * @param text text to which the style will be applied according to position
	 * @param position position on the demonlist
	 * @returns text
	 */
	getTextStyleByPosition(text, position) {
		return position <= 75 ? `**${text}**` : position > 150 ? text : `*${text}*`;
	},

	isNullOrUndefined(value) {
		return value == null || value == undefined;
	},

	/**
	 * @param {ChatInputCommandInteraction} interaction
	 * @param {Db} database
	 * @param {boolean} ephemeral 
	 * @param {boolean} usePermissions 
	 * @param {function(object)} func 
	 */
	async processServer(interaction, database, ephemeral, usePermissions, func) {
		try {
			await interaction.deferReply({ ephemeral: ephemeral });
			if (usePermissions && !server.isAdminOrOwner(interaction)) {
				await interaction.editReply('You do not have sufficient privileges to perform this action');
			} else {
				const serverInfo = await server.getServerInfo(database, interaction.guildId)
				if (serverInfo === null) {
					await interaction.editReply('Error in querying server information');
				} else {
					await func(serverInfo)
				}
			}
		} catch (error) {
			logger.ERR(error.message);
		}
	},

	/**
	 * Sends a response message and awaits for a user interaction to close it.
	 *
	 * @async
	 * @function responseMessageAwaitClose
	 * @param {ChatInputCommandInteraction} interaction - The interaction object from the Discord API.
	 * @param {Message} message - The message object to be sent as a response.
	 * @returns {Promise<void>} - Resolves when the interaction is completed or closed.
	 * @throws {Error} - Throws an error if the interaction fails or times out.
	 */
	async responseMessageAwaitClose(interaction, message, autodelete = true, lang = 'english') {
		try {
			let response = await interaction.editReply(message)

			const collectorFilter = i => i.user.id === interaction.user.id;
			let confirmation = await response.awaitMessageComponent(
				{
					filter: collectorFilter,
					time: 300000 // 5 min
				}
			);

			if (confirmation.customId === 'close') {
				await interaction.deleteReply();
			}
		} catch (e) {
			try {
				if (e.message !== errorMessages.InteractionCollectorErrorTime) {
					logger.ERR(e.message);
					await interaction.editReply(tts.getTranslation(lang, 'err_unknown'))
				} else {
					if (autodelete) {
						await interaction.deleteReply();
					} else {
						message.components.at(0).components.forEach(button => {
							if (button.toJSON().style !== ButtonStyle.Link) {
								button.setDisabled(true)
							}
						})

						await interaction.editReply(message);
					}
				}
			} catch (err) {
				logger.ERR(err.message);
			}
		}
	}
};