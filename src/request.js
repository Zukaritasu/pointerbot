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

const https = require('https');
const utils = require('./utils');
const { urls } = require('../resource.json');

module.exports = {

	/**
	 * Returns a JSON that is the result of an HTTP request to the Pointercrate REST api
	 * 
	 * @param path the API path
	 * @returns json
	 */
	getResponseJSON(path) {
		return new Promise(function (resolve, reject) {
			https.get(`${urls.pointercrate}${path}`, res => {
				let data = [];
				res.on('data', chunk => { data.push(chunk); });
				res.on('end', () => { resolve(JSON.parse(Buffer.concat(data).toString())); });
				res.on('error', err => { reject(err); })
			});
		});
	},

	/**
	 * Assigns a style to the demon name according to the position in the list
	 * 
	 * @param demon object (Json) containing demon information
	 * @returns name
	 */
	getDemonFormatName(demon) {
		return demon.position <= 75 ? `**${demon.name}**` : 
			demon.position > 150 ? demon.name : `*${demon.name}*`;
	},

	/**
	 * Returns a JSON with all the progress of the player
	 * 
	 * @param player_id 
	 * @returns 
	 */
	async getPlayerAllProgress(player_id) {
		// 'after' changes according to the position of the demon in the list
		let demons = [];
		const records_json = await getResponseJSON(`api/v1/records/?limit=100&after=0&player=${player_id}`);
		for (const record of records_json) {
			demons.push({
				name: getDemonFormatName(record.demon),
				progress: record.progress,
				position: record.demon.position
			});
		}
		return demons;
	},

	/**
	 * Searches for the first victor, formats the text and returns it.
	 * If the first victor is not achieved then it returns unknown
	 * 
	 * @param demon_position position of the demon in the list
	 * @param use_trophy indicates whether the trophy should be concatenated
	 * 		  to the first victor
	 * @returns 
	 */
	async getFirstVictor(demon_position, use_trophy) {
		const demon_json = await getResponseJSON(`api/v1/records/?progress=100&demon_position=${demon_position}&limit=1`);
		if (demon_json.length != 0)
			return utils.getUserNameBanned(demon_json[0].player) + (use_trophy ? ' :trophy:' : '');
		return 'unknown';
	}
};
