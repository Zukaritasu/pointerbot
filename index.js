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

const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');
const events = require('./events');


const client = new Client({ intents:
	[
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	] 
});

const commandFiles = require('node:fs').readdirSync('./commands').filter(file => file.endsWith('.js'));

// Commands are saved in the client command collection
client.commands = new Collection();
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => { events.processClientReady(client); });
client.on(Events.InteractionCreate, async interaction => { await events.processInteractionCreate(client, interaction); });
client.on(Events.MessageCreate, (msg) => { events.processMessageCreate(client, msg); });

client.login(token);
