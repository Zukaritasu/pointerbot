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
} = require('discord.js');

const request = require('../request')
const embeds = require('../embeds')
const utils = require('../utils')
const botenv = require('../botenv')

const PTC_RESPONSE_ERROR = 'Pointercrate API: the country has no player statistics'

async function processLeaderboardByCountry(response, confirmation, interaction, collectorFilter) {
    let page = 0;
    const country_code = confirmation.values[0]
    let responseJson = await request.getLeaderboardByCountry(null, country_code)
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
        message = embeds.getLeaderboardCountryEmbed(responseJson.players, page,
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

            responseJson = await request.getLeaderboardByCountry(url, country_code)
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
            message = embeds.getLeaderboardCountryEmbed(responseJson.players, page,
                `${country_code}`.toLowerCase(), responseJson.next);
            await confirmation.update(message);
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

async function execute(_client, database, interaction) {
    await utils.validateServerInfo(interaction, database, false, false, async (serverInfo) => {
        let page = 1;

        try {
            while (true) {
                let response = await interaction.editReply(embeds.getCountryEmbed(page));

                const collectorFilter = i => i.user.id === interaction.user.id;
                let confirmation = await response.awaitMessageComponent(
                    {
                        filter: collectorFilter,
                        time: 60000
                    }
                );

                if (confirmation.customId === 'back')
                    page--;
                else if (confirmation.customId === 'follow')
                    page++;
                else if (confirmation.customId === 'close') {
                    response.delete();
                    break;
                } else if (confirmation.customId === 'country') {
                    await processLeaderboardByCountry(response, confirmation, interaction, collectorFilter)
                    break;
                }
                await confirmation.update(embeds.getCountryEmbed(page));
            }
        } catch (e) {
            console.log(e)
            try {
                await interaction.editReply(
                    {
                        content: botenv.getJsonErros(serverInfo).COUNTRY_NOT_SELECTED,
                        embeds: [],
                        components: []
                    }
                );
            } catch (err) {

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