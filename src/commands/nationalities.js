// Copyright (C) 2025 Zukaritasu
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


// **************************************************************** //

const ROWS_PER_PAGE = 20
const TIMEOUT = 120000;

/**
 * @param {object[]} countries 
 * @param {number} begin 
 * @param {number} end 
 * @returns 
 */
function getEmbedNationalities(countries, begin, end) {
    let description = ''

    for (let i = begin; i < countries.length && i < end; i++) {
        description += `${i + 1}. :flag_${countries[i].country_code.toLowerCase()}: **${countries[i].nation}** *${countries[i].score.toFixed(2)}*\n`
    }

    return {
        content: '',
        embeds: [
            new EmbedBuilder()
                .setAuthor(embeds.author)
                .setColor(embeds.COLOR)
                .setTitle('Nationalities')
                .setDescription(description)
                .setFooter({ text: 'PointerBot' })
                .setThumbnail(embeds.author.iconURL)
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back')
                        .setEmoji('<:retroceder:1320736997941317715>')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(begin == 0),
                    new ButtonBuilder()
                        .setCustomId('follow')
                        .setEmoji('<:siguiente:1320749783505178725>')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(end >= countries.length),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('<:close:1320737181358227551>')
                        .setCustomId('close')
                )
        ]
    }
}

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
async function nationalities(interaction) {
    try {
        await interaction.deferReply()

        const countries = await request.getNationalities()
        if (countries instanceof Error || countries.length == 0) {
            await interaction.editReply('An unknown error has occurred'); return
        }

        const collectorFilter = i => i.user.id === interaction.user.id;
        let numPage = 1, confirmation = interaction, begin = 0, message = null
        try {
            while (true) {
                const funcReply = confirmation instanceof ChatInputCommandInteraction ? interaction.editReply.bind(interaction) :
                    confirmation.update.bind(confirmation);
                const response = await funcReply(message = getEmbedNationalities(countries.data, begin, begin + ROWS_PER_PAGE));
                confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: TIMEOUT });

                if (confirmation.customId === 'back') {
                    begin -= ROWS_PER_PAGE
                    --numPage
                } else if (confirmation.customId === 'follow') {
                    begin += ROWS_PER_PAGE
                    ++numPage
                } else if (confirmation.customId === 'close') {
                    await response.delete(); break
                }
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
    } catch (e) {
        try {
            logger.ERR(e);
            await interaction.editReply('An unknown error has occurred');
        } catch (err) {
            logger.ERR('Error sending message: ' + err.message);
        }
    }
}

/**
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
    if (interaction.member.id !== '591640548490870805') {
        await interaction.reply('Command out of order. Please try again later');
    } else {
        await nationalities(interaction)
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nationalities')
        .setDescription('The bot displays a list of scores by nationality'),
    execute
};
