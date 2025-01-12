/**
 * Copyright (C) 2023 Zukaritasu
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

const { Events, ActivityType } = require('discord.js');

/**
 * Counts calls to bot commands. Function created to study the statistics
 * of calls to the bot
 * 
 * @param {*} database 
 * @param {*} command 
 */
async function calls(database, command) {
    try {
        let calls = await database.collection('calls').findOne({ type: command })
        if (calls === null) {
            await database.collection('calls').insertOne(
                {
                    type: command,
                    count: 1
                }
            );

        } else {
            await database.collection('calls').updateOne(
                { _id: calls._id },
                { $set: { count: calls.count + 1 } }
            )
        }
    } catch (error) {

    }
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(_client, _database, interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (command !== null) {
                calls(_database, interaction.commandName)
                await command.execute(_client, _database, interaction);
            }
        }
    },
};