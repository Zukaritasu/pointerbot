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

const { trophy } = require('./resource.json');

/**
 * 
 * @param {*} type 
 * @param {*} position
 * @returns 
 */
function getTrophy(type, position) {
	if (trophy.hasOwnProperty(type)) {
		if (position == trophy[type].tops[0])
			return trophy[type].trophys[0];
		for (let i = 1; i < trophy[type].tops.length; i++)
			if (position <= trophy[type].tops[i])
				return trophy[type].trophys[i];
		return trophy[type].default;
	}
	return null;
}

module.exports = { getTrophy };