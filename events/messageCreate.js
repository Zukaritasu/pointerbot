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

const { Events, Message } = require('discord.js');
const { Db } = require('mongodb');
const server = require('../src/server');
const privateCommands = require('../src/botenv').getPrivateCommands()

const prefix = '!zk'

module.exports = {
    name: Events.MessageCreate,
    once: false,

    /** @param {Message} _message */
    async execute(client, database, message) {
        if (!message.author.bot && message.author.id === '591640548490870805') {
            const content = message.content.trim()
            for (const command of privateCommands) {
                if (content.startsWith(`${prefix} ${command.info.name}`)) {
                    await command.info.func(client, database, message, content.split(' ').slice(2))
                    break
                }
            }
        }
    },
};