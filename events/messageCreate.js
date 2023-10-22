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


const prefix = '$'

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		const content = message.content.trim().toLowerCase();
        if (content.startsWith(prefix) && content.length > 2) {
            const msg_parts = content.split(' ');
            const command = message.client.commands.get(msg_parts[0].substring(prefix.length, msg_parts[0].length));
            if (command != null) {
                await command.execute(msg, msg_parts);
            }
        }
	},
};