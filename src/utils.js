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

module.exports = {
	/**
	 * Returns the text with a dash in the middle indicating that the user is banned.
	 * 
	 * @param user user name
	 * @returns text
	 */
	getUserNameBanned(user) {
		return user.banned ? `__${user.name}__` : user.name;
	},

	/**
	 * Returns a text with a different style depending on the position in the list,
	 * top 75 (bold style), top 150 italic style, legacy list (normal text)
	 * 
	 * @param text text to which the style will be applied according to position
	 * @param position position on the demonlist
	 * @returns text
	 */
	getTextStyleByPosition(text, position) {
		return position <= 75 ? `**${text}**` : position > 150 ? text : `*${text}*`;
	},

	isNullOrUndefined(value) {
		return value == null || value == undefined;
	}
};