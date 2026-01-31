/**
 * Copyright (C) 2023 - 2026 Zukaritasu
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
const { ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const logger = require('../src/logger');

/**
 * @typedef {Object} ServerInfo
 * @property {ObjectId} _id - The unique identifier for the server in the database.
 * @property {string} serverId - The ID of the server.
 * @property {string} lang - The language code for the server.
 * @property {string} prefix - The command prefix for the server.
 */

/** 
 * Fetches server information from the database. If the server does not exist, it
 * creates a new entry with default values.
 * 
 * @param {Db} database - The MongoDB database instance
 * @param {string} id - The server ID
 * @returns {Promise<ServerInfo|null>} - The server information object or null if an error occurs
 */
async function getServerInfo(database, id) {
    let server = await database.collection('servers').findOne({ serverId: `${id}` })
    if (server === null) {
        const result = await database.collection('servers').insertOne(
            // default values
            server = {
                serverId: `${id}`,
                lang: 'english',
                prefix: '!p'
            });

        if (result.acknowledged) {
            server._id = result.insertedId.id
        } else {
            logger.ERR(`Error inserting an object to the database`)
            return null
        }
    }

    return server
}

/** 
 * Checks if the interaction member has administrator or owner permissions.
 * @param {ChatInputCommandInteraction} interaction - The interaction object from Discord.js
 * @returns {boolean} - True if the member is an administrator or owner, false otherwise
 */
function isAdminOrOwner(interaction) {
    const m = interaction.member;
    return m.user.id === interaction.guild.ownerId || m.permissions.has([PermissionFlagsBits.Administrator])
}

module.exports = { getServerInfo, isAdminOrOwner } 