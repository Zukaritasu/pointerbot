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
    Client,
    ChatInputCommandInteraction} = require('discord.js');

const utils = require('../utils');
const { Db } = require('mongodb');
const { languages } = require('../../locale/info.json');

/**
 * @param {Db} _database 
 * @param {ChatInputCommandInteraction} interaction 
 * @param {object} serverInfo 
 * @param {string} lang 
 */
async function updateServerLang(database, interaction, serverInfo, lang) {
    try {
        const result = await database.collection('servers').updateOne(
            { _id: serverInfo._id },
            { $set: { lang: lang } }
        )

        if (!result.acknowledged)
            throw null
        await interaction.editReply('The change was successful!');
    } catch (error) {
        await interaction.editReply('An unknown error occurred while changing the bot language');
    }
}


/** 
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
    await utils.validateServerInfo(interaction, database, true, true, async (serverInfo) => {
        const lang = interaction.options.getString('language').trim().toLowerCase()
        if (languages.find(value => value.name === lang) === undefined)
            await interaction.editReply('Language name entered is incomplete or not supported in this bot');
        else 
            await updateServerLang(database, interaction, serverInfo, lang)
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-language')
        .setDescription('The language to be used by the bot on this server')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Language')
                .setRequired(true)),
    execute,
};