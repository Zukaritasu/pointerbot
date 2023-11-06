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

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const aboutJson = require('../../locale/us/about.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about the development of this bot'),
	async execute(interaction) {

        const row = new ActionRowBuilder()
		const followButton = new ButtonBuilder()
			.setLabel('Donate')
			.setURL('https://ko-fi.com/zukaritasu')
			.setStyle(ButtonStyle.Link)
	
		row.addComponents(followButton);

		await interaction.reply({ embeds: [aboutJson], components: [row] });
	}
};