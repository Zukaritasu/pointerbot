/**
 * Copyright (C) 2022-2024 Zukaritasu
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


/**
 * 
 * @param {*} path 
 * @returns 
 */
function getResponseJSON(path) {
	return new Promise(function (resolve, reject) {
		https.get(`${urls.pointercrate}${path}`, res => {
			let data = [];
			res.on('data', chunk => { data.push(chunk); });
			res.on('end', () =>
			{ 
				const data_json = JSON.parse(Buffer.concat(data).toString());
				let pageMap = new Map();
				if ('links' in res.headers) {
					const pages = res.headers['links'].split(',');
					for (var i = 0; i < pages.length; i++) {
						const pageSearch = pages[i].split(';')
						if (pageSearch.length == 2) {
							pageMap.set(pageSearch[1].split('=')[1], pageSearch[0].replace('<', '').replace('>', ''));
						}
                    }
                }

				resolve({
					data: data_json,
					page: pageMap
				})
			});
			res.on('error', err => { reject(err); })
		});
	});
}

function getDemonFormatName(demon) {
	return demon.position <= 75 ? `**${demon.name}**` : 
		demon.position > 150 ? demon.name : `*${demon.name}*`;
}

/**
 * 
 * @param {*} url 
 * @param {*} code 
 * @returns 
 */
async function getLeaderboardByCountry(url, code) {
	let players = [];
	let responseData = await getResponseJSON(url == null ? 
		`api/v1/players/ranking/?limit=25&after=0&nation=${code}` : url);
	if (responseData instanceof Error) {
		return {
			players: []
		}
	} else {
		return {
			players: responseData.data,
			next: responseData.page.get('next'),
			prev: responseData.page.get('prev'),
		};
	}
}

/**
 * Returns all demons completed, to be completed and demons verified.
 * 
 * @param {*} player_id Player id
 * @returns 
 */
async function getPlayerAllProgress(player_id) {
	let demons = [];
	let after = 0;

	let responseData = await getResponseJSON(`api/v1/records/?limit=100&after=${after}&player=${player_id}`);

	while (true) {
		for (const record of responseData.data) {
			demons.push(
				{
					name: getDemonFormatName(record.demon),
					progress: record.progress,
					position: record.demon.position,
					verifier: false
				}
			);
		}

		if (responseData.page.get('next') == undefined)
			break;
		responseData = await getResponseJSON(responseData.page.get('next'));
    }

	responseData = await getResponseJSON(`api/v2/demons/listed?verifier_id=${player_id}`);
	for (const verified of responseData.data) {
		demons.push(
			{
				name: getDemonFormatName(
					{
						name: verified.name,
						position: verified.position
					}
				),
				progress: 100,
				position: verified.position,
				verifier: true
			}
		);
	}

	return demons;
}

async function getFirstVictor(demon_position, use_trophy) {
	const responseData = await getResponseJSON(`api/v1/records/?progress=100&demon_position=${demon_position}&limit=1`);
	if (responseData.data.length !== 0)
		return utils.getUserNameBanned(responseData.data[0].player) + (use_trophy ? ' :trophy:' : '');
	return 'unknown';
}

module.exports = { 
	getResponseJSON, 
	getDemonFormatName, 
	getPlayerAllProgress, 
	getFirstVictor,
	getLeaderboardByCountry
};
