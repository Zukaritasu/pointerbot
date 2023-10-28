// Copyright (C) 2023 Zukaritasu
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

const { SlashCommandBuilder, ActivityType } = require('discord.js');

/**
 * 
 * @param {*} interaction 
 */
async function execute(interaction, client) {
	if (interaction.user.id !== '591640548490870805') {
		await interaction.reply("No superuser privileges to change the bot activity and its description!");
		return
	}

	let hardest = interaction.options.getString('name', false);
	if (hardest == null) {
		await interaction.reply(`Interaction error: No option entered`);
	} else {
		client.user.presence.set({
			activities: [
				{
					name: hardest,
					type: ActivityType.Playing
				}
			]
		})
		await interaction.reply(`Bot activity has been successfully updated!`);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hardest')
		.setDescription('[Superuser] Set the most difficult demon in the rich presence of the bot.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('[Superuser] The name of the most difficult demon')
				.setRequired(true)
		),
	execute
};