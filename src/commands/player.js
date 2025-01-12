/**
 * Copyright (C) 2022-2025 Zukaritasu
 * 
 * his program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageComponentInteraction,
    Message
} = require('discord.js');

const request = require('../request');
const embeds = require('../embeds');
const utils = require('../utils');
const logger = require('../logger');
const errorMessages = require('../error-messages');
const embedPlayer = require('../embed-player');
const { Db } = require('mongodb');

const COUNT_LIST_ELEMENTS = 15;
const TIMEOUT = 120000;


/**
 * Class representing a response containing user name information.
 */
class UserNameResponse {
    /**
     * The interaction used to reply.
     * @type {ChatInputCommandInteraction | MessageComponentInteraction}
     */
    reply = null;

    /**
     * The player object.
     * @type {object}
     */
    player = null;

    /**
     * The message string.
     * @type {String}
     */
    message = null;

    /**
     * Create a UserNameResponse.
     * @param {String} [message=null] - The message string.
     * @param {object} [player=null] - The player object.
     * @param {ChatInputCommandInteraction | MessageComponentInteraction} [reply=null] - The interaction used to reply.
     */
    constructor(message = null, player = null, reply = null) {
        this.reply = reply;
        this.player = player;
        this.message = message;
    }
}


/**
 * Generates an embed message with a list of players and a selection menu.
 *
 * @param {Array} players - The list of player objects.
 * @param {number} begin - The starting index for the list of players to display.
 * @returns {Object} An object containing the embed message and components for the selection menu and navigation buttons.
 */
function getEmbedPlayersList(players, begin) {
	let description = '', countElements = 0;

	const menu = new StringSelectMenuBuilder()
	menu.setCustomId('player')
	menu.setPlaceholder('Select a player')

	for (let i = begin; i < players.length && i < begin + COUNT_LIST_ELEMENTS; i++) {
		const player = players[i];
		countElements++;
		description += `${i + 1}. **${player.name}** *score ${player.score.toFixed(2)}*\n`;
		menu.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(player.name)
			.setValue(player.name)
		);
	}

	const embed = new EmbedBuilder()
	embed.setColor(embeds.COLOR)
	embed.setAuthor(embeds.author)
	embed.setTitle('Players')
	embed.setDescription(description)
	embed.setTimestamp()
	embed.setFooter({ text: `PointerBot` });

	return players.length <= COUNT_LIST_ELEMENTS ?
		{
			embeds: [embed],
			components: [new ActionRowBuilder().addComponents(menu)]
		} :
		{
			embeds: [embed],
			components: [
				new ActionRowBuilder().addComponents(menu),
				new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('back')
						.setEmoji('<:retroceder:1320736997941317715>')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(begin < COUNT_LIST_ELEMENTS),
					new ButtonBuilder()
						.setCustomId('follow')
						.setEmoji('<:siguiente:1320749783505178725>')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(countElements < COUNT_LIST_ELEMENTS || begin + COUNT_LIST_ELEMENTS >= players.length)
				)
			]
		}
}


/**
 * Fetches player information from the Pointercrate API based on the provided name.
 *
 * @param {string} name - The name of the player to search for.
 * @returns {Promise<Object|string>} - A promise that resolves to the player data if found,
 * or an error message if the player does not exist or an error occurs.
 */
async function getPlayerName(name) {
	const response = await request.getResponseJSON(`api/v1/players/ranking/?name_contains=${encodeURIComponent(name)}`);
	if (response instanceof Error)
		return 'An unknown error has occurred'
	const players = response.data;
	if (!('length' in players) || players.length == 0)
		return 'Pointercrate API: player does not exist'
	return players;
}

/**
 * Executes the player command.
 *
 * @param {Client} _client - The Discord client instance.
 * @param {Db} database - The database instance.
 * @param {ChatInputCommandInteraction} interaction - The interaction instance.
 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
 */
async function execute(_client, database, interaction) {
    await utils.processServer(interaction, database, false, false, async (_serverInfo) => {
        try {
            let player = interaction.options.getString('name', false);
            if (!player) {
                await interaction.editReply(`Interaction error: No option entered`);
                return;
            }

            const players = await getPlayerName(player.toLowerCase().trim());
            if (typeof players === 'string') {
                await interaction.editReply(players);
                return;
            }

            if (players.length === 1) {
                const playerEmbed = embedPlayer.getPlayerEmbed(players[0], await request.getPlayerAllProgress(players[0].id));
                const message = {
                    embeds: [playerEmbed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('close')
                                	.setEmoji('<:close:1320737181358227551>')
                                .setStyle(ButtonStyle.Danger)
                        )
                    ]
                };

                try {
                    const response = await interaction.editReply(message);
                    const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: TIMEOUT });
                    if (confirmation.customId === 'close') 
                        await interaction.deleteReply();
                } catch (error) {
                    try {
                        if (error.message !== errorMessages.InteractionCollectorErrorTime) {
                            logger.ERR(error);
                        } else {
                                message.components[0].components[0].setDisabled(true);
                            await interaction.editReply(message);
                        }
                    } catch (err) {
                        logger.ERR(`Error sending edit reply: `, err.message);
                    }
                }
            } else {
                let begin = 0, confirmation = interaction;
                let embedPlayersList = getEmbedPlayersList(players, begin);
                while (true) {
                    const funcReply = confirmation instanceof ChatInputCommandInteraction ? interaction.editReply.bind(interaction) : 
                            confirmation.update.bind(confirmation);
                    confirmation = await (await funcReply(embedPlayersList))
                        .awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: TIMEOUT });
                    
                    if (confirmation.customId === 'back') {
                        embedPlayersList = getEmbedPlayersList(players, begin -= COUNT_LIST_ELEMENTS);
                    } else if (confirmation.customId === 'follow') {
                        embedPlayersList = getEmbedPlayersList(players, begin += COUNT_LIST_ELEMENTS);
                    } else if (confirmation.customId === 'player') {
                        begin = 0;
                        for (let i = 0; i < players.length; i++) {
                            if (players[i].name === confirmation.values[0]) {
                                const playerEmbed = embedPlayer.getPlayerEmbed(players[i], await request.getPlayerAllProgress(players[i].id));
                                const message = {
                                    embeds: [playerEmbed],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder().setCustomId('back')
                                                	.setEmoji('<:retroceder:1320736997941317715>')
                                                .setStyle(ButtonStyle.Primary),
                                            new ButtonBuilder().setCustomId('close')
                                                	.setEmoji('<:close:1320737181358227551>')
                                                .setStyle(ButtonStyle.Danger)
                                        )
                                    ]
                                };

                                try {
                                    const response = await confirmation.update(message);
                                    confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: TIMEOUT });
                                    if (confirmation.customId === 'close') {
                                        await interaction.deleteReply(); return;
                                    }
                                    else if (confirmation.customId === 'back') 
                                        break;
                                } catch (error) {
                                    try {
                                        if (error.message !== errorMessages.InteractionCollectorErrorTime) {
                                            logger.ERR(error);
                                        } else {
                                                message.components[0].components.forEach(c => c.setDisabled(true));
                                            await interaction.editReply(message);
                                        }
                                    } catch (err) {
                                        logger.ERR(`Error sending edit reply: `, err.message);
                                    }
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            try {
                if (e.message !== errorMessages.InteractionCollectorErrorTime) 
                    logger.ERR(e);
                await interaction.editReply(`Internal error: ${e.message}`);
            } catch (err) {
                logger.ERR(`Error sending reply`);
            }
        }
    });
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('Check the stats of a player who is registered in Pointercrate')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the player')
				.setRequired(true)),
	execute
};