/**
 * Copyright (C) 2023 - 2025 Zukaritasu
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

const { Events, Client } = require('discord.js');
const { supportServer } = require('../config.json')
const logger = require('../src/logger');
const { Guild } = require('discord.js');

/**
 * @param {Client} client 
 * @param {Guild} guild 
 */
async function botJoined(client, guild) {
	const guildServerSupport = client.guilds.cache.get(supportServer.id);
	if (guildServerSupport) {
		const channel = guildServerSupport.channels.cache.get((supportServer.notifyChannelID));
		if (channel) {
			try {
				channel.send(`The bot has been added to the server: ${guild.name} (id: ${guild.id}) ${guild.iconURL() ??
					"The server does not have an image"}`);
			} catch (error) {
				logger.ERR(error)
			}
		}
	}
}

module.exports = {
	name: Events.GuildCreate,
	once: false,
	execute: async (client, _database, guild) => await botJoined(client, guild),
};