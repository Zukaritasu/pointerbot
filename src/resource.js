/**
 * Copyright (C) 2022-2026 Zukaritasu
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

const { trophy, demons } = require('../resource.json');

// @ts-check

module.exports = {

	/**
	 * Returns a trophy emoji or string based on the user's position in the list.
	 * The trophy tiers are determined by the specified type and its corresponding 
	 * configuration in the resources.
	 * 
	 * @param {string} type - The category of trophy to retrieve (e.g., 'demonlist', 'stars').
	 * @param {number} position - The numerical rank or position of the user.
	 * @returns {string|null} The trophy string/emoji, or null if the type is invalid.
	 */
	getTrophy(type, position) {
		if (!trophy.hasOwnProperty(type))
			return null;

		for (let i = 0; i < trophy[type].tops.length; i++) {
			if (position <= trophy[type].tops[i]) {
				return trophy[type].trophys[i];
			}
		}
		return trophy[type].default;
	},

	/**
	 * Determines the image classification for a Demon based on its difficulty and status.
	 * 
	 * @param {object} info - The demon information object.
	 * @param {string} info.epic - The epic status or rating of the demon.
	 * @param {string} info.demonDifficulty - The numerical string representing the demon's difficulty.
	 * @returns {string} The filename or classification string for the demon's image.
	 */
	getDemonImageClassification(info) {
		const dd = parseInt(info.demonDifficulty);
		if (demons.images.length > dd && dd >= 0)
			return demons.images[dd][0];

		return demons.aux_image;
	}
};