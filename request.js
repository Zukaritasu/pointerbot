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

const https = require('https');
const utils = require('./utils');
const { urls } = require('./resource.json');

/**
 * returns a JSON that is the result of an HTTP request to the Pointercrate REST api
 */
function getJSON(path) {
	return new Promise( function(resolve, reject) {
		https.get(`${ urls.pointercrate }${ path }`, res => {
			let data = [];
			res.on('data', chunk => { data.push(chunk); });
			res.on('end', () => { resolve(JSON.parse(Buffer.concat(data).toString())); });
			res.on('error', err => { reject(err); })
		});
	});
}

/**
 * Assigns a style to the demon name according to the position in the list
 */
function getDemonFormatName(demon) {
	if (demon.position <= 75)
		return `**${ demon.name }**`;
	else if (demon.position > 150) 
		return `*${ demon.name }*`;
	return demon.name;
}

/**
 * returns a JSON with all the progress of the player
 */
async function getPlayerAllProgress(player_id) {
	// 'after' changes according to the position of the demon in the list
	let demons = [];
	const records_json = await getJSON(`api/v1/records/?limit=100&after=0&player=${player_id}`);
	for (const record of records_json) {
		demons.push({ 
			name: getDemonFormatName(record.demon), 
			progress: record.progress, 
			position: record.demon.position 
		});
	}
	return demons;
}

/**
 * 
 * @param {*} demon_position
 * @param {*} use_trophy
 * @returns 
 */
async function getFirstVictor(demon_position, use_trophy) {
	const demon_json = await getJSON(`api/v1/records/?progress=100&demon_position=${ demon_position }&limit=1`);
	if (demon_json.length != 0)
		return utils.getUserNameBanned(demon_json[0].player) + (use_trophy ? ' :trophy:' : '');
	return 'unknown';
}

module.exports = { getJSON, getPlayerAllProgress, getFirstVictor };
