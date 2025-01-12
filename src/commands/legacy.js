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

const { SlashCommandBuilder } = require('discord.js');

const pagination = require('../pagination');
const utils = require('../utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('legacy')
		.setDescription('List of legacy demons starting at 151 place'),
	async execute(_client, database, interaction) {
		await utils.processServer(interaction, database, false, false, async (_serverInfo) => {
			await pagination.processInteraction(interaction,
				{
					after: 150,
					title: 'Legacy List, **from position 151**',
					getFooter:  page => `Page ${page}`
				}
			)
		})
	}
};