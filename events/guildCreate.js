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

const { Events } = require('discord.js');
const { supportServer } = require('../config.json')

module.exports = {
	name: Events.GuildCreate,
	once: false,
	async execute(_client, _database) {
        const guild = _client.guilds.cache.get(supportServer.id);
        if (guild != null) {
            const channel = guild.channels.cache.get((supportServer.notifyChannelID));
            if (channel != null) {
                try {
                    channel.send(`The bot has been added to the server: ${_guild.name} (id: ${_guild.id}) ${_guild.icon}`);
                } catch (error) {
                    
                }
            }
        }
	},
};