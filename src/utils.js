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
const { ChatInputCommandInteraction } = require('discord.js');

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
	async validateServerInfo(interaction, database, ephemeral, usePermissions, func) {
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
	},

	/**
	 * id: close
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
 	 * @param {object} message
	 */
	async responseMessageAwaitClose(interaction, message) {
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
				response.delete();
			}
		} catch (e) { // time error
			console.log(e)
			try {
				await interaction.deleteReply();
			} catch (err) {

			}
		}
	}
};