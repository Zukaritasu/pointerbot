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

const { ChatInputCommandInteraction, MessageComponentInteraction } = require('discord.js');

const embeds = require('./embeds');
const request = require('./request');

const PTC_RESPONSE_ERROR = 'Pointercrate API: an error occurred while querying the information on the server'

async function respondInteraction(interaction, page, after, title, footer) {
    const responseData = await request.getResponseJSON(`api/v2/demons/listed?limit=25&after=${(25 * (page - 1)) + after }`);
    let result = null;
    let responseError = null;
    let messageEmbed = null;
    if (!(responseData instanceof Error)) {
        messageEmbed = await embeds.getDemonlistEmbed(responseData.data, page, title, footer, after === 150);
        if (interaction instanceof MessageComponentInteraction) {
            await interaction.update(messageEmbed);
        } else {
            result = await interaction.editReply(messageEmbed);
        }
    }
    else
        responseError = responseData;
    return {
        interaction: result,
        error: responseError, 
        message: messageEmbed
    }
}

async function processInteraction(interaction, info) {
    let page = 1;
    const collectorFilter = interaction => interaction.user.id === interaction.user.id;

    if (interaction instanceof ChatInputCommandInteraction)
        await interaction.deferReply();

    let message = null;
    let response = await respondInteraction(interaction, page, info.after, info.title, info.getFooter(page));
    if (response.error != null) {
        await interaction.editReply(PTC_RESPONSE_ERROR);
    } else {
        try {
            message = response.message;
            while (true) {
                const confirmation = await response.interaction.awaitMessageComponent(
                    {
                        filter: collectorFilter,
                        time: 60000
                    });
                if (confirmation.customId === 'back')
                    page--;
                else if (confirmation.customId === 'follow')
                    page++;
                const updateResponse = await respondInteraction(confirmation, page, info.after, info.title, info.getFooter(page));
                if (updateResponse.error != null) {
                    await confirmation.update(
                        {
                            content: PTC_RESPONSE_ERROR,
                            embeds: [],
                            components: []
                        });
                    break;
                }
                else
                    message = updateResponse.message;
            }
        } catch (e) {
            console.log(e);
            await interaction.editReply(
                {
                    embeds: [message.embeds[0]],
                    components: []
                });
        }
    }
}

module.exports = { processInteraction }