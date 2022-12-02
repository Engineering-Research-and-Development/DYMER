const redis = require('redis')
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
var crypto = require('crypto')

let client;

module.exports = {

    init: async function(isEnabled) {
        if (!isEnabled) { return false }

        client = redis.createClient({
            socket: {
                host: global.configService.cache.host,
                port: global.configService.cache.port
            },
            password: global.configService.cache.password
        });
        client.on('error', (err) => {
            console.log('REDIS connection lost due to: ', err.message);
            this.disconnect()
        });

        try {
            await client.connect();
            console.log(nameFile + ` | redisModule | Connected to REDIS!`)
            logger.info(nameFile + ` | redisModule | Connected to REDIS!`)
        } catch (e) {
            console.log("Unable to connect to REDIS due to ", e.message)
        }

    },
    disconnect: async function() {
        console.log("Disconnecting...")
        try {
            await client.disconnect();
            console.log(nameFile + ` | redisModule | Connected to REDIS!`)
            logger.info(nameFile + ` | redisModule | Connected to REDIS!`)
        } catch (error) {}

        console.log(nameFile + ` | redisModule | Connected to REDIS!`)
        logger.info(nameFile + ` | redisModule | Connected to REDIS!`)
    },

    ping: async function(isEnabled) {

        if (!isEnabled) { return false }

        let pingResp = await client.ping()

        if (pingResp == "PONG") {
            return true
        }
        return false

    },

    cancelKey: async function(key, isEnabled) {
        if (!isEnabled) { return false }

        await client.del(key)
    },

    readCacheByKey: async function(query, isEnabled) {

        if (!isEnabled) { return null }
        let hash = await this.calculateHash(query)
        let resp = {}
        try {
            resp = await client.hGetAll(hash)
            var userIdcache = await client.hGet(hash, "userId")
            logger.info(nameFile + ' | redisModule | userIdcache, reading cache hash: ' + userIdcache + ' , ' + hash);
            return resp
        } catch (e) {
            return null
        }
    },

    writeCacheByKey: async function(query, userId, origin, response, ids, indexes, typeservice, isEnabled) {
        if (!isEnabled) { return false }
        let hash = await this.calculateHash(query)
        console.log(JSON.parse(response))
        try {
            await client.hSet(hash, "query", hash);
            await client.hSet(hash, "userId", userId);
            await client.hSet(hash, "origin", origin);
            await client.hSet(hash, "response", response);
            await client.hSet(hash, "typeservice", typeservice)
            await client.hSet(hash, "ids", ids)
            await client.hSet(hash, "indexes", indexes)

            console.log(nameFile + ' | redisModule | writing cache hash: ' + hash);
            logger.info(nameFile + ' | redisModule | writing cache hash: ' + hash);

        } catch (e) {
            console.log("Unable to execute REDIS writing operation due to ", e.message)
        }
    },
    emptyCache: async function(isEnabled) {
        if (!isEnabled) { return false }

        console.log(nameFile + ` | redisModule | Empty Cache`)
        logger.info(nameFile + ` | redisModule | Empty Cache`)
        try {
            await client.flushAll()
        } catch (e) {
            console.log("Unable to empty REDIS cache due to ", e.message)
        }
    },
    calculateHash: async function(query) {
        return crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    },
    extractIds: async function(ret, isEnabled) {
        if (!isEnabled) { return false }

        let entitiesIds = [...new Set(ret.data.map(obj => obj._id))]
        let relationsIds = await this.extractIdsRelations(ret)
        let ids = entitiesIds.concat(relationsIds)

        return ids;
    },
    extractIdsRelations: async function(ret) {
        // console.log('extractIdsRelations', ret);
        return [...new Set(ret.data.reduce((ids, curr) => {
            if (curr.relations) {
                return ids.concat(curr.relations.map(r => r._id))
            } else {
                return ids
            }
        }, []))]
    },
    extractIndexes: async function(ret, isEnabled) {
        if (!isEnabled) { return false }

        let entitiesIndexes = [...new Set(ret.data.map(obj => obj._index))]
        let relationsIndex = await this.extractIndexRelations(ret)
        let indexes = entitiesIndexes.concat(relationsIndex)

        return indexes
    },
    extractIndexRelations: async function(ret) {
        return [...new Set(ret.data.reduce((indexes, curr) => {
            if (curr.relations) {
                return indexes.concat(curr.relations.map(r => r._index))
            } else {
                return indexes
            }
        }, []))]
    },
    invalidateCacheById: async function(idsToInvalidate, isEnabled) {
        if (!isEnabled) { return false }
        try {
            let keys = await client.keys('*')

            for (let key of keys) {
                let idsArray = (await client.hGet(key, 'ids'))
                let ids = idsArray.split(",")

                if (ids.some(idToDel => idsToInvalidate.includes(idToDel))) {
                    client.del(key)
                    console.log(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                    logger.info(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                }
            }
            return

        } catch (e) {
            console.log("Unable invalidate REDIS cache due to ", e.message)
        }
    },
    invalidateCacheByIndex: async function(index, isEnabled) {
        if (!isEnabled) { return false }
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                let indexesArray = (await client.hGet(key, 'indexes'))
                let indexes = indexesArray.split(",")

                if (indexes.find(indexToDel => indexToDel == index)) {
                    client.del(key)
                    console.log(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                    logger.info(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                }
            }
            return

        } catch (e) {
            console.log("Unable invalidate REDIS cache due to ", e.message)
        }
    },
    // updateCacheById: async function(idsToUpdate, isEnabled) {
    //     if (!isEnabled) { return false }
    //     try {
    //         let keys = await client.keys('*')

    //         for (let key of keys) {
    //             let idsArray = (await client.hGet(key, 'ids'))
    //             let ids = idsArray.split(",")

    //             if (ids.some(idToUp => idsToUpdate.includes(idToUp))) {
    //                 // Update key
    //                 //IDEA: 
    //                 // check in case of text
    //                 // 1. rimuovi quel id1 da ids
    //                 // 2. push id nell'array id2
    //                 // 3 e 4. Lo stesso per quanto concerne l'altro
    //                 client.del(key)
    //                 console.log(nameFile + ` | redisModule | invalidating cache at key ${key}`)
    //                 logger.info(nameFile + ` | redisModule | invalidating cache at key ${key}`)
    //             }
    //         }
    //         return

    //     } catch (e) {
    //         console.log("Unable invalidate REDIS cache due to ", e.message)
    //     }
   // },
}