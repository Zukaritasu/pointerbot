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

// @ts-check

const https = require('https');
const utils = require('./utils');
const logger = require('./logger');
const axios = require('axios');

/**
 * @typedef {object} PlayerNationality
 * @property {string} country_code - The ISO 3166-1 alpha-2 code of the nation.
 * @property {string} nation - The full name of the country.
 * @property {string|null} subdivision - The specific region or state (if available).
 */

/**
 * @typedef {object} Player
 * @property {number} id - Internal Pointercrate ID of the player.
 * @property {string} name - Display name of the player.
 * @property {boolean} banned - Whether the player is currently banned from the leaderboards.
 * @property {number} score - The total list points (score) of the player.
 * @property {number} rank - The current standing of the player on the global/national list.
 * @property {PlayerNationality|null} nationality - Nationality details or null if not set.
 */

/**
 * Fetches JSON data from the specified path on pointercrate.com.
 * 
 * @param {String} path - The API endpoint path.
 * @returns {Promise<{ data: any, page: Map<string, string>}|Error>} - A promise that resolves to the JSON
 * data or rejects with an error.
 */
function getResponseJSON(path) {
	return new Promise(function (resolve, reject) {

		/** @type {import('https').RequestOptions} */
		const options = {
			hostname: 'www.pointercrate.com',
			path: `/${path}`,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'User-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 ' +
					'(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Edg/130.0.0.0',
				'upgrade-insecure-requests': '1'
			}
		};

		https.get(options, res => {
			if (!res || !res.headers) {
                return reject(new Error('No response headers received'));
            }

			/** @type {Buffer[]} */
			let data = [];
			res.on('data', chunk => { data.push(Buffer.from(chunk)); });
			res.on('end', () => {
				const pageMap = new Map();
				const linkHeader = res.headers['links'];

				if (typeof linkHeader === 'string') {
					const pages = linkHeader.split(',');
					for (var i = 0; i < pages.length; i++) {
						const pageSearch = pages[i].split(';')
						if (pageSearch.length == 2) {
							pageMap.set(pageSearch[1].split('=')[1], pageSearch[0].replace('<', '').replace('>', ''));
						}
					}
				}

				resolve({
					data: JSON.parse(Buffer.concat(data).toString()),
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

/**
 * Formats the demon's name based on its rank on the list (Main, Extended, or Legacy).
 * - Positions 1-75 (Main List): **Bold**
 * - Positions 76-150 (Extended List): *Italic*
 * - Positions 151+ (Legacy List): Normal text
 * @param {{ position: number, name: string}} demon - The demon object (uses position and name).
 * @returns {string} The formatted name as a Markdown string.
 */
function getDemonFormatName(demon) {
	return demon.position <= 75 ? `**${demon.name}**` :
		demon.position > 150 ? demon.name : `*${demon.name}*`;
}

/**
 * Gets the leaderboard of players by country.
 * 
 * @param {string} url - If null, uses default URL.
 * @param {string} code - Country code.
 * @param {number} limit - Number of players to retrieve.
 * @returns {Promise<{ players: Player[], next: string|undefined, prev: string|undefined }>}
 */
async function getLeaderboardByCountry(url, code, limit = 25) {
	let responseData = await getResponseJSON(url == null ?
		`api/v1/players/ranking/?limit=${limit}&after=0&nation=${code}` : url);
	if (responseData instanceof Error) {
		return {
			players: [], 
			next: undefined, 
			prev: undefined
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
 * Retrieves a comprehensive list of a player's progress, including 100% completions, 
 * partial progress records, and verified levels.
 * * This function handles pagination for records and merges data from 
 * both the records and demons API endpoints.
 * * @param {number|string} player_id - The unique ID of the player.
 * @returns {Promise<import('./typedefs').DemonCompleted[]>} 
 * A list of formatted demon progress objects.
 */
async function getPlayerAllProgress(player_id) {
    let demons = [];
    let after = 0;

    // First fetch for records
    let responseData = await getResponseJSON(`api/v1/records/?limit=100&after=${after}&player=${player_id}`);

    if (responseData instanceof Error)  {
        throw responseData;
    }

    /** @type {{data: import('./typedefs').Record[], page: Map<string, string>}} */
    let records = responseData;

    // Pagination loop for records
    while (true) {
        for (const record of records.data) {
            demons.push({
                name: getDemonFormatName(record.demon),
                progress: record.progress,
                position: record.demon.position,
                verifier: false
            });
        }

        const nextPage = records.page.get('next');
        if (!nextPage) break;
        
        responseData = await getResponseJSON(nextPage);
        if (responseData instanceof Error) throw responseData;

        records = responseData;
    }

    // Fetch verified demons
    responseData = await getResponseJSON(`api/v2/demons/listed?verifier_id=${player_id}`);
    if (responseData instanceof Error) throw responseData;

    /** @type {{data: import('./typedefs').DemonInfo[], page: Map<string, string>}} */
    const demonsVerified = responseData;

    for (const verified of demonsVerified.data) {
        demons.push({
            name: getDemonFormatName({
                name: verified.name,
                position: verified.position
            }),
            progress: 100,
            position: verified.position,
            verifier: true
        });
    }

    return demons;
}

/**
 * Fetches the first victor's name for a given demon position and formats it.
 * * It queries for the oldest approved 100% record at that position.
 * 
 * @param {number} demonPosition - The rank position of the demon.
 * @param {boolean} use_trophy - Whether to append the custom trophy emoji.
 * @returns {Promise<string>} The formatted name (with potential ban styling) or 'unknown'.
 */
async function getFirstVictor(demonPosition, use_trophy) {
	const response = await getResponseJSON(`api/v1/records/?progress=100&demon_position=${demonPosition}&limit=1`);
	if (response instanceof Error) {
		throw Error
	}

	/** @type {import('./typedefs').Record[]} */
	const record = response.data
	if (record.length !== 0)
		return utils.getUserNameBanned(record[0].player) + (use_trophy ? ' <:trophy:1327811771863400448>' : '');
	return 'unknown';
}


/**
 * Retrieves the full record object for the first victor of a demon.
 * * Useful for extracting metadata like video URLs or player IDs.
 * 
 * @param {number} demonPosition - The rank position of the demon.
 * @returns {Promise<import('./typedefs').Record|null>} The first record found or null.
 */
async function getFirstVictorInfo(demonPosition) {
	const response = await getResponseJSON(`api/v1/records/?progress=100&demon_position=${demonPosition}&limit=1`);
	if (response instanceof Error) {
		throw Error
	}

	/** @type {import('./typedefs').Record[]} */
	const record = response.data
	if (record.length !== 0)
		return record[0]
	return null;
}

/**
 * Fetches level metadata directly from RobTop's servers.
 * * Parses the raw response string where:
 * - Key '42' corresponds to the Epic/Legendary/Mythic rating.
 * - Key '43' corresponds to the specific Demon difficulty.
 * 
 * @param {string|number} levelId - The official Geometry Dash level ID.
 * @returns {Promise<import('./typedefs').LevelClassification | null>} Level info or null if the level doesn't exist.
 */
async function getLevelClassification(levelId) {
	const data = new URLSearchParams();
	data.append('secret', 'Wmfd2893gb7')
	data.append('str', `${levelId}`)
	data.append('type', '0')
	data.append('star', '1')

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
