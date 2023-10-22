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

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../embeds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('main')
		.setDescription('Check the list of demons in the range 1 - 75'),
	async execute(interaction) {
		await interaction.reply(await embeds.getDemonlistEmbed(null));
		/*await interaction.deferReply();
		await interaction.editReply(await embeds.getDemonlistEmbed(null));*/

		/*console.log("Holaaaaa");
		if (!(interaction instanceof ChatInputCommandInteraction)) {
			console.log("A-A");
			 interaction.reply( embeds.getDemonlistEmbed(null));
			console.log("A");
		} else {
			console.log("B-B");
			 
			console.log("B");
			 interaction.editReply( embeds.getDemonlistEmbed(null));
			console.log("C");
		}*/
	}
};