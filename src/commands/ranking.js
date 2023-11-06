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

const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction
} = require('discord.js');

const request = require('../request');
const embeds = require('../embeds');

const PTC_RESPONSE_ERROR = 'Pointercrate API: an error occurred when consulting the list of players in the ranking'

async function respondInteraction(interaction, page) {
    const responseData = await request.getResponseJSON(`api/v1/players/ranking/?limit=25&after=${25 * (page - 1)}`);
    let result = null;
    let responseError = null;
    let messageEmbed = null;
    if (!(responseData instanceof Error)) {
        const rankingData = await embeds.getRankingEmbed(responseData, page);
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

async function execute(interaction) {
    let pageNumber = interaction.options.getInteger('page', false);
    let page = 1;

    const collectorFilter = interaction => interaction.user.id === interaction.user.id;

    if (pageNumber != null && pageNumber != undefined) {
        page = pageNumber;
        if (page <= 0) {
            page = 1;
        }
    }
    if (interaction instanceof ChatInputCommandInteraction)
        await interaction.deferReply();

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
                        time: 60000
                    }
                );
                if (confirmation.customId === 'back')
                    page--;
                else if (confirmation.customId === 'follow')
                    page++;
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
        } catch (e) {
            console.log(e);
            try {
                await interaction.editReply(
                    {
                        embeds: [message.embeds[0]],
                        components: []
                    }
                );
            } catch (err) {
                
            }
        }
    }
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