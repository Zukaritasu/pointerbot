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

const { Client, GatewayIntentBits, ActivityType, Collection, Guild, IntentsBitField } = require('discord.js');
const { token, uriDatabase } = require('../config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Db, MongoClient } = require('mongodb');
const botenv = require('./botenv');
const request = require('./request');
const logger = require('./logger');

(async () => {
	/** @type Db */
	let database = null

	try {
		database = (await (mongodb = new MongoClient(uriDatabase)).connect())
			.db('pointerbot')
		logger.INF('Database connection successful!')
	} catch (e) {
		logger.ERR(e)
		return
	}

	const topOne = await database.collection('config').findOne({ type: 'playing' }, 
	{
		projection: { _id: 0, value: 1 }
	}) ?? { value: '<Unknown>' }

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds
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
		logger.ERR(error);
	}).then(() => {
		logger.INF('Successfully Logged!');
		// The top 1 level will be updated every 10 minutes
		setInterval(async () => {
			try {
				const responseData = await request.getResponseJSON('api/v2/demons/listed?limit=1&after=0')
				if (responseData.data.length !== 0) {
					const hardestLevel = responseData.data[0].name;
					if (hardestLevel !== client.user.presence.activities[0].name) {
						await require('./commands/_hardest').updateHardestDemon(database, hardestLevel);
						client.user.presence.set({
							activities: [{
									name: hardestLevel,
									type: ActivityType.Playing
								}
							]
						})
					}
				}
			} catch (error) {
				logger.ERR(error);
				
			}
		}, 600000);
	});
})()
