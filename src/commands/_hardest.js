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
 * @param {Db} database 
 * @param {Message} interaction
 * @param {string} hardest 
 */
async function updateHardestLevel(database, message,  hardest) {
	try {
		const result = await database.collection('config').updateOne(
			{ type: 'playing' },
			{ $set: { value: hardest } }
		)

		if (!result.acknowledged)
			throw null
		await message.reply({ content: 'The hardest update was successful!', 
			ephemeral: true });
		return true
	} catch (error) {
		await message.reply({ content: 'An unknown error occurred while changing hardest', 
			ephemeral: true });
		return false
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
		const hardestLevel = array.join(' ')
		if (await updateHardestLevel(database, message, hardestLevel)) {
			client.user.presence.set({
				activities: [
					{
						name: hardestLevel,
						type: ActivityType.Playing
					}
				]
			})
		}
	}
}

module.exports = {
	info: { 
		name: 'hardest',
		func: execute
	}
};