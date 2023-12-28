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
    ChatInputCommandInteraction } = require('discord.js');

const { Db } = require('mongodb');
const utils = require('../utils');

/**
 * @param {Db} database
 * @param {ChatInputCommandInteraction} interaction 
 * @param {object} serverInfo 
 * @param {string} prefix 
 */
async function updateServerPrefix(database, interaction, serverInfo, prefix) {
    try {
        const result = await database.collection('servers').updateOne(
            { _id: serverInfo._id },
            { $set: { prefix: prefix } }
        )

        if (!result.acknowledged)
            throw null
        await interaction.editReply('The change was successful!');
    } catch (error) {
        await interaction.editReply('An unknown error occurred while changing the bot prefix');
    }
}

/** 
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
    await utils.validateServerInfo(interaction, database, true, true, async (serverInfo) => {
        // The number of characters of the prefix is validated by Discord
        await updateServerPrefix(database, interaction, serverInfo, interaction.options
            .getString('prefix').trim().toLowerCase())
    })
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-prefix')
        .setDescription('Prefix of the commands used by this bot')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('Prefix of the commands used by this bot')
                .setRequired(true)
                .setMaxLength(3)
                .setMinLength(1)),
    execute,
};