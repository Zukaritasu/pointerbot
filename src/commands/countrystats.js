// Copyright (C) 2022 -2025 Zukaritasu
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

const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Client
} = require('discord.js');

const request = require('../request')
const embeds = require('../embeds')
const utils = require('../utils')
const botenv = require('../botenv')
const logger = require('../logger')
const countriesJson = require('../../locale/countries.json')
const errorMessages = require('../error-messages');
const { Db } = require('mongodb');

const PTC_RESPONSE_ERROR = 'Pointercrate API: the country has no player statistics'
const MENU_PAGE_SIZE = 20
const MAX_PLAYERS_PER_PAGE = 15


/**
 * @param {String} countryCode 
 * @returns {String}
 */
function getFlagEmoji(countryCode) {
    const codePoints = countryCode.toUpperCase()
        .split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

/**
 * 
 * @param {number} page 
 * @returns 
 */
function getCountryEmbed(page) {
    const menu = new StringSelectMenuBuilder()
    menu.setCustomId('country')
    menu.setPlaceholder('Select a country');

    const countries = countriesJson.data.sort(function (a, b) {
        if (a.name.charCodeAt(0) < b.name.charCodeAt(0))
            return -1;
        else if (a.name.charCodeAt(0) > b.name.charCodeAt(0))
            return 1;
        return 0;
    })

    let description = ''
    for (let i = MENU_PAGE_SIZE * (page - 1); i < countries.length && i != (MENU_PAGE_SIZE * (page)); i++) {
        description += `${i + 1}. ${countries[i].name}\n`
        menu.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(countries[i].name.length > MENU_PAGE_SIZE ? countries[i].name.substring(0, 22).concat('...') : countries[i].name)
            .setValue(countries[i].code)
            .setEmoji(getFlagEmoji(countries[i].code))
        );
    }

    return {
        embeds: [
            new EmbedBuilder()
                .setColor(embeds.COLOR)
                .setAuthor(embeds.author)
                .setTitle('List of Countries with stats')
                .setDescription(description)
                .setFooter({ text: `Page ${page}` })
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder().addComponents(menu),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setEmoji('<:retroceder:1320736997941317715>')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page == 1),
                new ButtonBuilder()
                    .setCustomId('follow')
                    .setEmoji('<:siguiente:1320749783505178725>')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled((MENU_PAGE_SIZE * page) > countries.length),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:close:1320737181358227551>')
                    .setCustomId("close")
            )
        ]
    }
}

/**
 * @param {*} players 
 * @param {*} numPage 
 * @param {*} countryCode 
 * @param {*} next 
 */
function getLeaderboardCountryEmbed(players, numPage, countryCode, next) {
    let description = ''

    if (players.length > 0) {
        for (let i = 0, pos = (MAX_PLAYERS_PER_PAGE * numPage) + 1; i < players.length; i++, pos++) {
            const player = players[i];
            description += `${pos}. **${player.name}** *${player.score.toFixed(2)}*\n`;
        }
    }

    let footerText = `Page ${numPage + 1}`
    const player = players[0]
    if ('nationality' in player) {
        footerText = `${player.nationality.nation}  - ${footerText}`
    }

    return {
        content: '',
        embeds: [
            new EmbedBuilder()
                .setAuthor(embeds.author)
                .setColor(embeds.COLOR)
                .setTitle('Country stats ' + player.nationality.nation)
                .setDescription(description)
                .setFooter({ text: footerText })
                .setThumbnail(`https://flagcdn.com/h240/${countryCode}.png`)
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setEmoji('<:retroceder:1320736997941317715>')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(numPage === 0),
                    new ButtonBuilder()
                        .setCustomId('follow')
                        .setEmoji('<:siguiente:1320749783505178725>')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(utils.isNullOrUndefined(next)),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('<:close:1320737181358227551>')
                        .setCustomId('close')
                )
        ]
    }
}

/**
 * 
 * @param {*} response 
 * @param {*} confirmation 
 * @param {*} interaction 
 * @param {*} collectorFilter 
 * @returns {Promise<boolean>}
 */
async function processLeaderboardByCountry(response, confirmation, interaction, collectorFilter) {
    let page = 0;
    const country_code = confirmation.values[0]
    let responseJson = await request.getLeaderboardByCountry(null, country_code, MAX_PLAYERS_PER_PAGE)
    if (responseJson.players.length === 0) {
        await confirmation.update(
            {
                content: PTC_RESPONSE_ERROR,
                embeds: [],
                components: []
            }
        );
        return
    }

    let message = null;
    try {
        page = 0;
        message = getLeaderboardCountryEmbed(responseJson.players, page,
            `${country_code}`.toLowerCase(), responseJson.next);
        await confirmation.update(message);

        while (true) {
            confirmation = await response.awaitMessageComponent(
                {
                    filter: collectorFilter,
                    time: 60000
                }
            );

            let url = null
            if (confirmation.customId === 'back') {
                page--;
                url = responseJson.prev
            } else if (confirmation.customId === 'follow') {
                page++;
                url = responseJson.next
            } else if (confirmation.customId === 'close') {
                response.delete();
                break;
            }

            responseJson = await request.getLeaderboardByCountry(url, country_code, MAX_PLAYERS_PER_PAGE)
            if (responseJson.players.length === 0) {
                await confirmation.update(
                    {
                        content: PTC_RESPONSE_ERROR,
                        embeds: [],
                        components: []
                    }
                );
                return
            }
            message = getLeaderboardCountryEmbed(responseJson.players, page,
                `${country_code}`.toLowerCase(), responseJson.next);
            await confirmation.update(message);
        }

    } catch (e) {
        try {
            if (e.message !== errorMessages.InteractionCollectorErrorTime) {
                logger.ERR(e);
                await interaction.editReply('An unknown error has occurred');
            } else {
                message.components.at(0).components.forEach(button => button.setDisabled(true))
                await interaction.editReply(message);
            }
        } catch (err) {
            logger.ERR('Error sending message: ' + err.message);
        }
    }

    return true // close
}

/**
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
    await utils.processServer(interaction, database, false, false, async (serverInfo) => {
        try {
            let page = 1;
            const collectorFilter = i => i.user.id === interaction.user.id;
            let confirmation = interaction
            while (true) {
                const funcReply = confirmation instanceof ChatInputCommandInteraction ? interaction.editReply.bind(interaction) :
                    confirmation.update.bind(confirmation);
                const response = await funcReply(getCountryEmbed(page));
                confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });

                switch (confirmation.customId) {
                    case 'back': page--; break;
                    case 'follow': page++; break;
                    case 'close': await response.delete(); break;
                    default:
                        await processLeaderboardByCountry(response, confirmation, interaction, collectorFilter);
                        return;
                }
            }
        } catch (e) {
            try {
                if (e.message !== errorMessages.InteractionCollectorErrorTime) {
                    logger.ERR(e);
                    await interaction.editReply('An unknown error has occurred');
                } else {
                    await interaction.editReply(
                        {
                            content: botenv.getJsonErros(serverInfo).COUNTRY_NOT_SELECTED,
                            embeds: [],
                            components: []
                        }
                    );
                }
            } catch (err) {
                logger.ERR('Error sending message: ' + err.message);
            }
        }
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countrystats')
        .setDescription('Displays the ranking of players by country'),
    execute
};