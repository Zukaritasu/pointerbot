const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} = require('discord.js');

const resource = require('./resource');
const request = require('./request');
const utils = require('./utils');
const { urls, emojis } = require('../resource.json');
const countries = require('../locale/locale-info.json')
const countries2 = require('../locale/countries.json')
const axios = require('axios');
const logger = require('./logger');
const embeds = require('./embeds');


//*********************************************************************** */

/**
 * @param {object} demons 
 * @returns {string}
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
 * @param {object} demons 
 * @returns {string}
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
 * @param {object} struct fields
 * @param {object} demon 
 * @param {boolean} isCompleted 
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
 * @param {string} fieldTitle 
 * @param {object} demons 
 * @param {boolean} isCompleted 
 * @param {boolean} useVerifier 
 * @returns {object[] | object}
 */
function getFieldsDemons(fieldTitle, demons, isCompleted, useVerifier) {
    if (demons.length == 0)
        return { name: fieldTitle, value: 'None' };
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
 * @param {object} player 
 * @param {object} demons 
 * @returns {EmbedBuilder}
 */
function getPlayerEmbed(player, demons) {
    const embed = new EmbedBuilder()
    embed.setColor(0x2f9960)
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