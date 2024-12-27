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

const { fork } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const logger = require('./src/logger')

const HASHLIST_FILENAME = './hashlist.json'

process.chdir(__dirname);

function generateSHA256(filePath) {
	return crypto.createHash('sha256').update(JSON.stringify(require(filePath))).digest('hex')
}

/**
 * @param {string} command 
 * @returns 
 */
async function execJSFileSynch(command) {
	return !(await new Promise((resolve, reject) => {
		fork(command).on('exit', (code) => {
			if (code != 0)
				logger.ERR(`Subprocess is terminated with code ${code}`)
			else
				logger.INF(`Subprocess is terminated with code 0`)
			resolve(code != 0)
		}).on('error', (error) => {
			console.error(`${error}`);
			reject(true)
		}).on('message', (message) => {
			console.log(`${message}`);
		})
	}))
}

const commandsPath = path.join(__dirname, 'src/commands');
let commands = []
fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).forEach(file => {
	if (!file.startsWith('_')) {
		commands.push(
			{
				name: file,
				absolutePath: path.join(commandsPath, file)
			}
		)
	}
});

const writeHashlistFile = () => {
	let new_haslist = []
	commands.forEach(command => new_haslist.push(
		{
			name: command.name,
			hash: generateSHA256(command.absolutePath)
		}
	))

	fs.writeFileSync(HASHLIST_FILENAME, JSON.stringify(new_haslist, null, 2))
}

if (commands.length != 0) {
	(async () => {
		try {
			if (!fs.existsSync(HASHLIST_FILENAME)) {
				writeHashlistFile()
				if (!(await execJSFileSynch('./src/restapi.js')))
					return
			} else {
				/** @type {{name: string, hash: string}[]} */
				let hl = require(HASHLIST_FILENAME)
				if (hl.length !== commands.length) {
					writeHashlistFile()
					if (!(await execJSFileSynch('./src/restapi.js')))
						return
				} else {
					for (let i = 0; i < commands.length; i++) {
						const data = hl.find(data => data.name === commands[i].name)
						if (data === undefined || generateSHA256(commands[i].absolutePath) !== data.hash) {
							writeHashlistFile()
							if (!(await execJSFileSynch('./src/restapi.js')))
								return
							break;
						}
					}
				}
			}
		} catch (error) {
			logger.ERR(error)
			return
		}

		while (true) {
			await execJSFileSynch('./src/bot.js')
			setTimeout(() => { }, 5000);
		}
	})()
}