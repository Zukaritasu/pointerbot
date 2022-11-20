// Copyright (C) 2022 Zukaritasu
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

const { Client, Events, GatewayIntentBits, ActivityType, ApplicationCommandManager, Collection } = require('discord.js');
const request = require('./request');

// The default prefix of the bot
const prefix = 'p!';

function registerCommands(client) {
	if (client.commands != null) {
		for (const command of client.commands.values()) {
			client.application.commands.create({
				name: command.data.name,
				description: command.data.description,
				options: command.data.options
			},);
		}
	}
}

async function processClientReady(client) {
	client.user.setActivity('New Top 1', { type: ActivityType.Playing });
	registerCommands(client);
	console.log(`Ready! Logged in as ${client.user.tag}`);
} 

async function processInteractionCreate(client, interaction) {
	if (!interaction.isChatInputCommand()) 
		return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (command != null) {
		try {
			await command.execute(interaction);
		} catch (error) {
			
		}
	}
}

async function processMessageCreate(client, msg) {
	const message = msg.content.trim().toLowerCase();
	if (message.startsWith(prefix) && message.length > 2) {
		const msg_parts = message.split(' ');
		const command = client.commands.get(msg_parts[0].substring(prefix.length, msg_parts[0].length));
		if (command != null) {
			await command.execute(msg, msg_parts);
		}
	}
}

module.exports = { processClientReady, processInteractionCreate, processMessageCreate  };
