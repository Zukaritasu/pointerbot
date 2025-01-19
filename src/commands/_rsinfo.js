const { Client, Message } = require('discord.js');
const logger = require('../logger');
const { Db } = require('mongodb');

/**
 * 
 * @param {Client} client 
 * @param {Db} database 
 * @param {Message} message 
 * @param  {...any} _args 
 */
async function execute(client, database, message, ..._args) {
    try {
        client.guilds.cache.forEach(async guild => {
            let result
            const serverInfo = await database.collection('servers').findOne({ serverId: `${guild.id}` })
            if (serverInfo === null) {
                result = await database.collection('servers').insertOne(
                    {
                        serverId: `${guild.id}`,
                        serverName: guild.name,
                        serverIcon: guild.iconURL() ?? '',
                        countUsers: guild.memberCount,
                        lang: 'english',
                        prefix: '!p'
                    });
            } else {
                result = await database.collection('servers').updateOne(
                    { _id: serverInfo._id },
                    {
                        $set: {
                            serverName: guild.name,
                            serverIcon: guild.iconURL() ?? '',
                            countUsers: guild.memberCount,
                        }
                    }
                )
            }

            if (result.acknowledged)
                await message.react('✅')
            else {
                logger.ERR(`Error inserting/updating an object to the database`)
                await message.react('❌')
            }
        });
    } catch (error) {
        logger.ERR(error)
    }
}


module.exports = {
    info: {
        name: 'rsinfo',
        description: 'Revalidate servers information (Statistics)',
        func: execute
    }
};