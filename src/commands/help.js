// Copyright (C) 2022 - 2025 Zukaritasu
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

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

const botenv = require('../botenv');
const utils = require('../utils');
const { Db } = require('mongodb');

/* ============================================================== */

/** 
 * @param {Client} _client 
 * @param {Db} database 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function execute(_client, database, interaction) {
	await utils.processServer(interaction, database, false, false, async (serverInfo) => {
		await interaction.editReply({
			embeds: [botenv.getHelpEmbed(serverInfo.lang)]
		});
	})
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Show the help of this bot'),
	execute
};