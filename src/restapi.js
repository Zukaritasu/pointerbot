/**
 * Copyright (C) 2022-2023 Zukaritasu
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

const { Collection, REST, Routes } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const botenv = require('./botenv');
const { clientId, token } = require('../config.json');
const logger = require('../src/logger');

/** ///////////// */

const rest = new REST().setToken(token);
(async () => {
    try {
        const commands = botenv.getCommandsCollection().map(value => value.data.toJSON())
        logger.INF(`Started refreshing ${commands.length} application (/) commands`)

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        logger.INF(`Successfully reloaded ${data.length} application (/) commands`);
    } catch (e) {
        logger.ERR(e)
        process.exit(1)
    }
})();
