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

const { SlashCommandBuilder, StringSelectMenuBuilder } = require('discord.js');

function getSelectMenuBuilder() {
    const comboBox = new StringSelectMenuBuilder()
		.setCustomId('demon')
		.setPlaceholder('Select a demon')

    comboBox.addOptions(new StringSelectMenuOptionBuilder()
        .setLabel(`Language`)
        .setValue(`lang`)
    );

    return comboBox;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('To adjust the bot options'),
	async execute(interaction) {
        if (interaction.user.id !== '591640548490870805') {
            await interaction.reply('This command is under maintenance');
            return
        }
		
        console.log(interaction.user.flags)
        await interaction.reply('Settings!!');
	}
};