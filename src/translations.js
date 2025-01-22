/**
 * Copyright (C) 2025 Zukaritasu
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

const langInfo = require('../locale/info.json');
const path = require('node:path');
const fs = require('node:fs');

const translations = {
    'english': require("../locale/translations/english.json"),
    'spanish': require("../locale/translations/spanish.json")
};

function getTranslation(lang, key, def = '') {
    let translation = translations[lang]
    if (!translation)
        translation = translations.english
    return translation[key] || def;
}

/**
 * @param {string} lang language name 
 * @returns {string[]} list of files corresponding to the help
 */
function getHelpElementsTranslation(lang) {
    const code = langInfo.languages.find(value => value.name === lang) ?? langInfo.languages[0].code
    let dirpath = path.join(__dirname, `../locale/${code}/help`)
    if (!fs.existsSync(dirpath))
        dirpath = path.join(__dirname, `../locale/us/help`)
    return fs.readdirSync(dirpath).filter(file => file.endsWith('.json') && !file.startsWith('_')).map(filePath => path.join(dirpath, filePath))
}

module.exports = {
    getTranslation,
    getHelpElementsTranslation
}
