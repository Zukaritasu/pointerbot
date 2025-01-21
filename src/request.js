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
const logger = require('./logger');
const axios = require('axios');
const { urls } = require('../resource.json');


/**
 * @param {String} path 
 * @returns {Promise<object|Error>}
 */
function getResponseJSON(path) {
	return new Promise(function (resolve, reject) {
		const options = {
			hostname: 'www.pointercrate.com',
			path: `/${path}`,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'User-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Edg/130.0.0.0',
				'upgrade-insecure-requests': 1
			}
		};

		https.get(options, res => {
			let data = [];
			res.on('data', chunk => { data.push(chunk); });
			res.on('end', () => {
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
			res.on('error', err => { 
				logger.ERR(err.message);
				reject(err);
			})
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
async function getLeaderboardByCountry(url, code, limit = 25) {
	let players = [];
	let responseData = await getResponseJSON(url == null ?
		`api/v1/players/ranking/?limit=${limit}&after=0&nation=${code}` : url);
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
		return utils.getUserNameBanned(responseData.data[0].player) + (use_trophy ? ' <:trophy:1327811771863400448>' : '');
	return 'unknown';
}


/**
 * Fetches the first victor information for a given demon position.
 *
 * @param {number} demonPosition - The position of the demon in the list.
 * @returns {Promise<Object|null>} A promise that resolves to the first victor's information object if found, otherwise null.
 */
async function getFirstVictorInfo(demonPosition) {
	const responseData = await getResponseJSON(`api/v1/records/?progress=100&demon_position=${demonPosition}&limit=1`);
	if (responseData.data.length !== 0)
		return responseData.data[0];
	return null;
}

/**
 * The epic rating for the level. 0 = none, 1 = epic, 2 = legendary, 3 = mythic.
 * @param {string} levelId 
 * @returns {Promise<{ epic: string, demonDifficulty: string } | null>}
 */
async function getLevelClassification(levelId) {
	const data = new URLSearchParams({
        "secret": "Wmfd2893gb7",
        "str": `${levelId}`,
		"type": 0,
		"star": 1
    });

    const response = await axios.post('http://www.boomlings.com/database/getGJLevels21.php', data, {
        headers: {
            'User-Agent': '',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

	if (response.data == '-1') {
		return null;
	}

	let info = {
		epic: '',
		demonDifficulty: ''
	}

	let key = '';
    let value = '';
    let isKey = true;
	const str = response.data.split('#')[0];

	for (let i = 0; i < str.length; i++) {
		if (str[i] === ':') {
            if (isKey) {
                isKey = false;
            } else {
                if (key === '42') {
					info.epic = value;
				} else if (key === '43') {
					info.demonDifficulty = value;
				}
                key = ''; value = '';
                isKey = true;
            }
        } else {
            if (isKey) {
                key += str[i];
            } else {
                value += str[i];
            }
        }
	}

	return info;
}

module.exports = {
	getResponseJSON,
	getDemonFormatName,
	getPlayerAllProgress,
	getFirstVictor,
	getLeaderboardByCountry,
	getFirstVictorInfo,
	getLevelClassification,
	getNationalities: () => getResponseJSON('api/v1/nationalities/ranking')
};
