// Copyright (C) 2022-2025 Zukaritasu
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
    MessageComponentInteraction,
    Client,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const request = require('../request');
const embeds = require('../embeds');
const utils = require('../utils');
const logger = require('../logger');
const errorMessages = require('../error-messages');
const { Db } = require('mongodb');

const PTC_RESPONSE_ERROR = 'Pointercrate API: an error occurred when consulting the list of players in the ranking'

/** user response timeout limit */
const MAX_TIMEOUT = 180000 // 3 min

/** number of rows per page */
const ROWS_PER_PAGE = 25


/**
 * Generates an embed message for the ranking based on the provided response data and page number.
 *
 * @param {Object} responseData - The response data from the Pointercrate API.
 * @param {Array} responseData.data - The array of player data.
 * @param {number} responseData.data[].rank - The rank of the player.
 * @param {string} responseData.data[].name - The name of the player.
 * @param {number} responseData.data[].score - The score of the player.
 * @param {Object} responseData.data[].nationality - The nationality of the player.
 * @param {string} responseData.data[].nationality.country_code - The country code of the player's nationality.
 * @param {Object} responseData.page - The pagination information.
 * @param {number} page - The current page number.
 * @returns {Object} An object containing the content and message with embeds and components.
 */
function getRankingEmbed(responseData, page) {
    if (responseData.data.length === 0) {
        return {
            content: 'Pointercrate API: page limit has been reached',
            message: {
                embeds: [], components: []
            }
        };
    }

    let description = ''
    const players = responseData.data;
    if (players.length > 0) {
        players.forEach(player => {
            const country = player.nationality == null ? '<:default_flag:1327841356013633646>' :
                `:flag_${player.nationality.country_code.toLowerCase()}:`
            description += `${player.rank}. ${country} **${player.name}** *${player.score.toFixed(2)}*\n`;
        });
    }

    const embed = new EmbedBuilder()
    embed.setColor(embeds.COLOR)
    embed.setAuthor(embeds.author)
    embed.setTitle('International ranking')
    embed.setDescription(description)
    embed.setFooter({ text: `Page ${page}` })
    embed.setTimestamp()

    return {
        content: null,
        message: {
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setEmoji('<:retroceder:1320736997941317715>')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId('follow')
                    .setEmoji('<:siguiente:1320749783505178725>')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(responseData.data.length !== ROWS_PER_PAGE || responseData.page.get('next') == undefined),
                new ButtonBuilder()
                    .setCustomId('close')
                    .setEmoji('<:close:1320737181358227551>')
                    .setStyle(ButtonStyle.Danger)
            )]
        }
    }
}

/**
 * Responds to an interaction with ranking data.
 *
 * @param {ChatInputCommandInteraction | MessageComponentInteraction} interaction - The interaction to respond to.
 * @param {number} page - The page number of the ranking data to retrieve.
 * @returns {Promise<{interaction: any, error: string|null, message: any}>} An object containing the interaction result, any error message, and the message embed.
 */
async function respondInteraction(interaction, page) {
    const responseData = await request.getResponseJSON(`api/v1/players/ranking/?limit=25&after=${ROWS_PER_PAGE * (page - 1)}`);
    let result = null, responseError = null, messageEmbed = null;

    if (!(responseData instanceof Error)) {
        const rankingData = getRankingEmbed(responseData, page);
        messageEmbed = rankingData.message;
        if (rankingData.content != null) {
            responseError = rankingData.content;
        } else if (interaction instanceof MessageComponentInteraction) {
            await interaction.update(messageEmbed);
        } else {
            result = await interaction.editReply(messageEmbed);
        }
    }
    else
        responseError = PTC_RESPONSE_ERROR;
    return {
        interaction: result,
        error: responseError,
        message: messageEmbed
    }
}

/**
 * Executes the ranking command.
 *
 * @param {Client} _client - The client object (not used in this function).
 * @param {Db} database - The database object for server information validation.
 * @param {ChatInputCommandInteraction} interaction - The interaction object representing the command interaction.
 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
 */
async function execute(_client, database, interaction) {
    await utils.processServer(interaction, database, false, false, async (_serverInfo) => {
        const pageNumber = interaction.options.getInteger('page', false);
        let page = 1;

        const collectorFilter = interaction => interaction.user.id === interaction.user.id;

        if (pageNumber !== null && pageNumber !== undefined)
            page = pageNumber <= 0 ? 1 : pageNumber;

        let message = null;
        let response = await respondInteraction(interaction, page);
        if (response.error != null) {
            await interaction.editReply(response.error);
        } else {
            try {
                message = response.message;
                while (true) {
                    const confirmation = await response.interaction.awaitMessageComponent(
                        {
                            filter: collectorFilter,
                            time: MAX_TIMEOUT
                        }
                    );
                    if (confirmation.customId === 'back')
                        page--;
                    else if (confirmation.customId === 'follow')
                        page++;
                    else if (confirmation.customId === 'close') {
                        await interaction.deleteReply()
                        break
                    }

                    const updateResponse = await respondInteraction(confirmation, page);
                    if (updateResponse.error != null) {
                        await confirmation.update(
                            {
                                content: updateResponse.error,
                                embeds: [],
                                components: []
                            }
                        );
                        break;
                    }
                    else
                        message = updateResponse.message;
                }
            } catch (error) {
                try {
                    if (error.message !== errorMessages.InteractionCollectorErrorTime)
                        logger.ERR(error)
                    else {
                        message.components.at(0).components.forEach(button => button.setDisabled(true))
                        await interaction.editReply(
                            {
                                embeds: [message.embeds[0]],
                                components: [
                                    message.components[0]
                                ]
                            }
                        );
                    }
                } catch (err) {
                    logger.ERR('Error sending edit reply')
                }
            }
        }
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Shows the ranking of players')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('The page number. There are 25 users on each page')),
    execute
};