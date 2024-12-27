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

const { Collection, Client, Guild } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const langInfo = require('../locale/info.json');

/**
 * @param {string} langCode 
 * @param {string} name 
 * @returns {object}
 */
function getJsonByLanguage(langCode, name) {
    const info = langInfo.languages.find(value => value.name === langCode) ?? langInfo.languages[0]
    try {
        return require(`../locale/${info.code}/${name}.json`);
    } catch (error) {
        // The auxiliary language will be called in case of error!!
        return require(`../locale/us/${name}.json`);
    }
}

module.exports = {

    /** @returns {Collection<string, object>} */
    getCommandsCollection: () => {
        const commandsPath = path.join(__dirname, '../src/commands');
        let commands = new Collection()
        /* Files starting with a _ in their name are discarded as private commands */
        fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && !file.startsWith('_')).forEach(file => {
            const command = require(path.join(commandsPath, file));
            commands.set(command.data.name, command);
        });
        return commands
    },

    getPrivateCommands: () => {
        const commandsPath = path.join(__dirname, '../src/commands');
        return fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js') && file.startsWith('_'))
            .map(file => require(path.join(commandsPath, file)))
    },

    getEventsCollection: () => {
        const eventsPath = path.join(__dirname, '../events');
        return fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'))
            .map(file => require(path.join(eventsPath, file)))
    },

    getAboutEmbed: (lang) => { return getJsonByLanguage(lang, 'about') },
    getHelpEmbed: (lang) => { return getJsonByLanguage(lang, 'help') },
    /**
     * @param {string} lang
     * @returns {object} 
     */
    getJsonErros: (lang) => { return getJsonByLanguage(lang, 'errors') },
}
