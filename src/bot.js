/**
 * Copyright (C) 2022-2023 Zukaritasu
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

const { Client, GatewayIntentBits, ActivityType, Collection } = require('discord.js');
const { token, uriDatabase } = require('../config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Db, MongoClient } = require('mongodb');
const botenv = require('./botenv');

(async () => {
	/** @type Db */
	let database = null

	try {
		database = (await (mongodb = new MongoClient(uriDatabase)).connect())
			.db('pointerbot')
		console.error('Database connection successful!');
	} catch (e) {
		console.error(e);
		return
	}

	const topOne = await database.collection('config').findOne({ type: 'playing' }, 
	{
		projection: { _id: 0, value: 1 }
	}) ?? { value: '<Unknown>' }

	const client = new Client({
		intents:
			[
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			],
		presence: {
			activities: [
				{
					name: topOne.value,
					type: ActivityType.Playing
				}
			]
		}
	});

	client.commands = botenv.getCommandsCollection()

	botenv.getEventsCollection().forEach(event => {
		const eventFunc = (...args) => event.execute(client, database, ...args)
		if (event.once) {
			client.once(event.name, eventFunc);
		} else {
			client.on(event.name, eventFunc);
		}
	})

	client.login(token).catch((error) => {
		console.error(error);
	});
})()
