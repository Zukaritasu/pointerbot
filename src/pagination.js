// Copyright (C) 2022-2023 Zukaritasu
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

const { ChatInputCommandInteraction, MessageComponentInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const embeds = require('./embeds');
const request = require('./request');
const logger = require('./logger');
const utils = require('./utils');
const errorMessages = require('./error-messages');

const PTC_RESPONSE_ERROR = 'Pointercrate API: an error occurred while querying the information on the server'
const MAX_TIMEOUT = 180000 // 3 min

/**
 * @param {*} demons 
 * @param {*} page 
 * @param {*} title 
 * @param {*} footer_text 
 * @param {*} legacy 
 * @returns 
 */
function getDemonlistEmbed(demons, page, title, footer_text, legacy) {
    let description = ''
    if (demons.length !== 0) {
        demons.forEach(demon => {
            description += `${demon.position}. <:Extreme_Demon:1246531162638385302> **${demon.name}** *${utils.getUserNameBanned(demon.publisher)}*\n`;
        });
    }

    const embed = new EmbedBuilder()
    embed.setColor(embeds.COLOR)
    embed.setAuthor(embeds.author)
    embed.setTitle(title)
    embed.setDescription(description)
    embed.setTimestamp()
    embed.setFooter({ text: footer_text });

    return {
        embeds: [embed],
        components: [
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
                    .setDisabled((!legacy && page == 3) || demons.length != 25),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:close:1320737181358227551>')
                    .setCustomId("close")
            )
        ]
    };
}

/**
 * @param {*} interaction 
 * @param {*} page 
 * @param {*} after 
 * @param {*} title 
 * @param {*} footer 
 * @returns 
 */
async function respondInteraction(interaction, page, after, title, footer) {
    const responseData = await request.getResponseJSON(`api/v2/demons/listed?limit=25&after=${(25 * (page - 1)) + after}`);
    let result = null;
    let responseError = null;
    let messageEmbed = null;
    if (!(responseData instanceof Error)) {
        messageEmbed = getDemonlistEmbed(responseData.data, page, title, footer, after === 150);
        if (interaction instanceof MessageComponentInteraction) {
            await interaction.update(messageEmbed);
            result = interaction;
        } else {
            result = await interaction.editReply(messageEmbed);
        }
    } else {
        responseError = responseData;
    }
    return {
        interaction: result,
        error: responseError,
        message: messageEmbed
    }
}

/**
 * @param {*} interaction 
 * @param {*} info 
 */
async function processInteraction(interaction, info) {
    let page = 1;
    const collectorFilter = i => i.user.id === interaction.user.id;

    let message = null;
    let response = await respondInteraction(interaction, page, info.after, info.title, info.getFooter(page));
    if (response.error != null) {
        await interaction.editReply(PTC_RESPONSE_ERROR);
    } else {
        try {
            message = response.message;
            while (true) {
                const confirmation = await response.interaction.awaitMessageComponent({
                    filter: collectorFilter,
                    time: MAX_TIMEOUT
                });
                if (confirmation.customId === 'back') {
                    page--;
                } else if (confirmation.customId === 'follow') {
                    page++;
                } else if (confirmation.customId === 'close') {
                    try {
                        await confirmation.deferUpdate();
                        if (confirmation.message) {
                            await confirmation.message.delete();
                        } else {
                            logger.ERR('Could not find the message to delete.');
                        }
                    } catch (error) {
                        logger.ERR('Error deleting message:', error);
                    }
                    break;
                }
                const updateResponse = await respondInteraction(confirmation, page, info.after, info.title, info.getFooter(page));
                if (updateResponse.error != null) {
                    await confirmation.update({
                        content: PTC_RESPONSE_ERROR,
                        embeds: [],
                        components: []
                    });
                    break;
                } else {
                    message = updateResponse.message;
                }
            }
        } catch (e) {
            try {
                if (e.message !== errorMessages.InteractionCollectorErrorTime) {
                    logger.ERR(e.message);
                    await interaction.editReply('An unknown error has occurred');
                } else {
                    message.components.at(0).components.forEach(button => button.setDisabled(true))
                    await interaction.editReply(message);
                }
            } catch (err) {
                logger.ERR('Error sending message: ' + err.message);
            }
        }
    }
}

module.exports = { processInteraction }