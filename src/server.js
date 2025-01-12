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

const { Db, Long } = require('mongodb');
const { ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const logger = require('../src/logger');


/** 
 * @param {Db} database
 * @param {string} id 
 */
async function getServerInfo(database, id) {
    let server = await database.collection('servers').findOne({ serverId: `${id}` })
    if (server === null) {
        const result = await database.collection('servers').insertOne(
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

/** @param {ChatInputCommandInteraction} interaction */
function isAdminOrOwner(interaction) {
    const m = interaction.member;
    return m.user.id === interaction.guild.ownerId || m.permissions.has([PermissionFlagsBits.Administrator])
}

module.exports = { getServerInfo, isAdminOrOwner } 