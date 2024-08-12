// Copyright (C) 2023 Zukaritasu
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

const { SlashCommandBuilder, ActivityType, Message, Client } = require('discord.js');
const { Db } = require('mongodb');

/** 
 * @param {Db} db
 * @param {string} hardest 
 */
async function updateHardestDemon(db, hardest) {
	try {
		const result = await db.collection('config').updateOne(
			{ type: 'playing' },
			{ $set: { value: hardest }}
		)
		if (!result.acknowledged)
			throw null
		return { message: 'The hardest update was successful!', 
			succeded: true,  error: null }
	} catch (error) {
		return { message: 'An unknown error occurred while changing hardest', 
			succeded: false, error: error }
	}
}

/**
 * @param {Client} client 
 * @param {Db} database 
 * @param {Message} interaction 
 * @param {string[]} array 
 */
async function execute(client, database, message, array) {
	if (array.length !== 0) {
		const sendMessage = async (interaction, strMessage) => {
			await interaction.reply(
				{ 
					content: strMessage, 
			 		ephemeral: true 
				}
			);
		}

		const hardestLevel = array.join(' ')
		const result = await updateHardestDemon(database, hardestLevel)
		await sendMessage(message, result.message);
		if (result.succeded)  {
			client.user.presence.set({
				activities: [{
						name: hardestLevel,
						type: ActivityType.Playing
					}
				]
			})
		}
	}
}

module.exports = {
	updateHardestDemon,
	info: { 
		name: 'hardest',
		func: execute
	}
};