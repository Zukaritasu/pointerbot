/**
 * Copyright (C) 2026 Zukaritasu
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


/**
 * @typedef {object} PlayerNationality
 * @property {string} country_code - The ISO 3166-1 alpha-2 code (e.g., 'VE').
 * @property {string} nation - The full official name of the country.
 * @property {string|null} subdivision - Regional subdivision name, if applicable.
 */

/**
 * @typedef {object} PlayerRanking
 * @property {number} id - Unique identifier for the player in Pointercrate.
 * @property {string} name - The player's display name.
 * @property {boolean} banned - Boolean indicating if the player is banned from the list.
 * @property {number} score - Total points calculated based on their records.
 * @property {number} rank - Current position in the global or national leaderboard.
 * @property {PlayerNationality|null} nationality - Nationality information or null if not provided.
 */

/**
 * @typedef {object} Demon
 * @property {number} id - Internal ID of the demon in the list.
 * @property {number} position - Current position of the demon on the list.
 * @property {string} name - Name of the level.
 */

/**
 * @typedef {object} Player
 * @property {number} id - Internal ID of the player.
 * @property {string} name - Name of the player.
 * @property {boolean} banned - Whether the player is banned.
 */

/**
 * https://pointercrate.com/api/v1/records/?limit=100&after=0&player=?
 * 
 * @typedef {object} Record
 * @property {number} id - Unique identifier of the record.
 * @property {number} progress - Percentage of completion (typically 100 for approved records).
 * @property {string} video - URL of the proof video.
 * @property {string} status - Current status of the record (e.g., 'approved', 'rejected', 'submitted').
 * @property {Demon} demon - Brief information about the demon this record belongs to.
 * @property {Player} player - Brief information about the player who achieved this record.
 */

/**
 * https://pointercrate.com/api/v2/demons/listed?verifier_id=?
 * @typedef {object} DemonInfo
 * @property {number} id - Unique identifier for the demon in Pointercrate.
 * @property {number} position - Current rank on the demonlist.
 * @property {string} name - The name of the level.
 * @property {number} requirement - Minimum percentage required for a record to be accepted.
 * @property {string} video - URL of the official showcase or verification video.
 * @property {string} thumbnail - URL of the video's thumbnail.
 * @property {Player} publisher - Information about the user who published the level.
 * @property {Player} verifier - Information about the user who verified the level.
 * @property {number|null} level_id - The official Geometry Dash level ID.
 */

/**
 * @typedef {object} DemonCompleted
 * @property {string} name - The name of the level.
 * @property {number} progress - Percentage of completion (typically 100 for approved records)
 * @property {number} position - Current position of the demon on the list.
 * @property {boolean} verifier - Information about the user who verified the level.
 */

/**
 * @typedef {object} LevelClassification
 * @property {string} epic - Epic rating: "0"=None, "1"=Epic, "2"=Legendary, "3"=Mythic.
 * @property {string} demonDifficulty - Internal difficulty: "3"=Easy, "4"=Medium, "5"=Hard, "6"=Insane, "0"=Extreme.
 */

export {}