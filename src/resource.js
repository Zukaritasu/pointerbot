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

const { trophy } = require('../resource.json');

module.exports = { 

	/**
	 * Return the trophy according to the position in the list.
	 * The type of trophy can change according to the {@link ../resource.json} file.
	 * 
	 * @param type specifies the type of trophy required
	 * @param position position on the demonlist
	 * @returns thophy
	 */
	getTrophy(type, position) {
		if (!trophy.hasOwnProperty(type))
			return null;
	
		for (let i = 0; i < trophy[type].tops.length; i++)
			if (position <= trophy[type].tops[i])
				return trophy[type].trophys[i];
		return trophy[type].default;
	} 
};