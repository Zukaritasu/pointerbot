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

// @ts-check

const {
	EmbedBuilder
} = require('discord.js');

const resource = require('./resource');
const utils = require('./utils');
const embeds = require('./embeds');

/**
 * Calculates the total number of completed demons categorized by list tier.
 * It filters the list for 100% completions and increments counters for:
 * - Main List (Positions 1-75)
 * - Extended List (Positions 76-150)
 * - Legacy List (Positions 151+)
 * 
 * 
 * @param {import('./typedefs').DemonCompleted[]} demons - The collection of player demon data.
 * @returns {string} A formatted string summarizing completions (e.g., "10 Main, 5 Extended, 20 Legacy").
 */
function getPlayerDemonsCompleted(demons) {
	let main = 0, extended = 0, legacy = 0;
	for (const demon of demons) {
		if (demon.progress != 100)
			continue;
		if (demon.position <= 75)
			main++;
		else if (demon.position <= 150)
			extended++;
		else
			legacy++;
	}
	return `${main} Main, ${extended} Extended, ${legacy} Legacy`;
}

/**
 * Identifies the player's hardest demon from a list of completions.
 * It iterates through all records and finds the one with the lowest 'position' 
 * value (Rank 1 being the hardest) where progress is exactly 100%.
 * 
 * 
 * @param {import('./typedefs').DemonCompleted[]} demons - The list of player achievements.
 * @returns {string} The name of the hardest demon with its trophy emoji, or 'None'.
 */
function getHardestDemon(demons) {
    let hardest = 'None';
    if (demons.length != 0) {
        let position = Number.MAX_SAFE_INTEGER;
        for (const demon of demons) {
            if (position > demon.position && demon.progress === 100) {
                position = demon.position;
                hardest = demon.name + ' ' + resource.getTrophy('demon', demon.position);
            }
        }
    }
    return hardest;
}

/**
 * Appends a demon's name and progress to the current embed field, 
 * creating a new field if the 1024-character limit is exceeded.
 * 
 * 
 * @param {[import('discord.js').APIEmbedField[], import('discord.js').APIEmbedField]} struct 
 * An array where [0] is the full fields array and [1] is the current active field.
 * @param {import('./typedefs').DemonCompleted} demon - The demon data to append.
 * @param {boolean} isCompleted - Whether to omit or include the progress percentage.
 */
function addDemonInField(struct, demon, isCompleted) {
    let demon_name = (struct[1].value.length != 0 ? ' - ' : '') + demon.name.replace(' ', '\u00A0');
    if (!isCompleted)
        demon_name += ' ' + utils.getTextStyleByPosition(`(${demon.progress}%)`, demon.position);
    if ((struct[1].value.length + demon_name.length) > 1024) {
        struct[0].push({ name: '\u200B', value: '' });
        if (demon_name.startsWith(' - ')) {
            demon_name = demon_name.substring(3, demon_name.length);
        }
    }
    struct[0][struct[0].length - 1].value += demon_name;
}

/**
 * Generates one or more embed fields for a specific category of demons.
 * It filters the demon list based on completion status or verifier status, 
 * and handles potential Discord character limits by splitting data into multiple fields.
 * 
 * 
 * @param {string} fieldTitle - The title to display in the embed field.
 * @param {import('./typedefs').DemonCompleted[]} demons - The collection of player demon data.
 * @param {boolean} isCompleted - If true, filters for 100% progress; if false, for <100%.
 * @param {boolean} useVerifier - If true, only includes demons where the player is the official verifier.
 * @returns {import('discord.js').APIEmbedField | import('discord.js').APIEmbedField[]} 
 * A single field or an array of fields if the content exceeds character limits.
 */
function getFieldsDemons(fieldTitle, demons, isCompleted, useVerifier) {
    if (demons.length == 0)
        return { name: fieldTitle, value: 'None' };

    /** @type {import('discord.js').APIEmbedField[]} */
    let fields = [{ name: fieldTitle, value: '' }];
    for (const demon of demons) {
        if (useVerifier) {
            if (demon.verifier) {
                addDemonInField([fields, fields[fields.length - 1]], demon, isCompleted);
            }
            continue
        }
        if (!((isCompleted && demon.progress != 100) || (!isCompleted && demon.progress == 100))) {
            addDemonInField([fields, fields[fields.length - 1]], demon, isCompleted);
        }
    }
    return fields[0].value.length == 0 ?
        {
            name: fieldTitle,
            value: 'None'
        } : fields;
}

/**
 * Generates a comprehensive player profile embed.
 * * This function assembles:
 * - Basic stats (Rank with trophy, Score with 2 decimal precision).
 * - Quantitative stats (Total demons completed).
 * - Highest achievement (Hardest Demon).
 * - Nationality visual (Flag thumbnail via FlagCDN).
 * - Categorized lists (Completions, Progress, and Verifications).
 * 
 * @param {import('./typedefs').PlayerRanking} player - The player's ranking data.
 * @param {import('./typedefs').DemonCompleted[]} demons - List of all demon interactions for the player.
 * @returns {import('discord.js').EmbedBuilder} A fully constructed Discord embed.
 */
function getPlayerEmbed(player, demons) {
    const embed = new EmbedBuilder()
    embed.setColor(embeds.COLOR)
    embed.setAuthor(embeds.author)
    embed.setTitle(player.name)
    embed.addFields(
            { name: 'Demonlist rank', value: `${player.rank} ${resource.getTrophy('player', player.rank)}`, inline: true },
            { name: 'Demonlist score', value: player.score.toFixed(2), inline: true },
            { name: 'Demonlist stats', value: getPlayerDemonsCompleted(demons), inline: true },
            { name: 'Hardest demon', value: getHardestDemon(demons), inline: true }
        )
    
    if (player.nationality && player.nationality.country_code) {
        embed.setThumbnail(`https://flagcdn.com/h240/${player.nationality.country_code.toLowerCase()}.png`)
    }

    embed.addFields(getFieldsDemons('Demons Completed', demons, true, false))
    embed.addFields(getFieldsDemons('Progress on', demons, false, false))
    embed.addFields(getFieldsDemons('Demons verified', demons, true, true))
    embed.setTimestamp()
    embed.setFooter({ text: `PointerBot` });
    return embed;
}

module.exports = {
    getPlayerEmbed
}