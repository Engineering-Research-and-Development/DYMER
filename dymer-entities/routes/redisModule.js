const redis = require('redis')
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
var crypto = require('crypto');
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
            logger.error(nameFile + ` | redisModule | REDIS connection lost due to: ${err.message}`)
            console.error('REDIS connection lost due to: ', err.message);
            this.disconnect(isEnabled)
        });
        try {
            await client.connect();
            logger.info(nameFile + ` | redisModule | Connected to REDIS!`)
        } catch (e) {
            logger.error(nameFile + ` | redisModule | Unable to connect to REDIS due to: ${e.message}`)
            console.error("Unable to connect to REDIS due to ", e.message)
        }
        return;
    },
    disconnect: async function(isEnabled) {
        if (!isEnabled) { return false }
        logger.info(nameFile + ` | redisModuleDisconnecting...`)
        try {
            await client.disconnect();
            logger.info(nameFile + ` | redisModule | Disconnected to REDIS!`)
        } catch (error) {
            logger.error(nameFile + ` | redisModule | Unable to disconnect from REDIS due to: ${error.message}`)
            console.error("Unable to disconnect from REDIS due to ", error.message)
        }
        return;
    },
    ping: async function(isEnabled) {
        if (!isEnabled) { return false }
        let pingResp = await client.ping()
        return pingResp == "PONG";
    },
    cancelKey: async function (key, isEnabled) {
        if (!isEnabled) { return false }
        try {
            await client.del(key)
        } catch (e) {
            logger.error(nameFile + ` | redisModule | Unable remove key ${key} in REDIS due to: ${e.message}`)
            console.error(`Unable remove key ${key} in REDIS due to: ${e.message}`)
        }
    },
    readCacheByKey: async function(query, isEnabled) {
        if (!isEnabled) { return null }
        let hash = await this.calculateHash(query)
        let resp = {}
        try {
            resp = await client.hGetAll(hash)
            let userIdcache = await client.hGet(hash, "userId")
            logger.info(nameFile + ' | redisModule | userIdcache, reading cache hash: ' + userIdcache + ' , ' + hash);
            return resp
        } catch (e) {
            return null
        }
    },
    writeCacheByKey: async function(query, userId, origin, response, ids, indexes, typeservice, isEnabled) {
        if (!isEnabled) { return false }
        let hash = await this.calculateHash(query)
        try {
            await client.hSet(hash, "query", hash);
            await client.hSet(hash, "userId", userId);
            await client.hSet(hash, "origin", origin);
            await client.hSet(hash, "response", response);
            await client.hSet(hash, "typeservice", typeservice);
            await client.hSet(hash, "ids", ids);
            await client.hSet(hash, "indexes", indexes);
            logger.info(nameFile + ' | redisModule | writing cache hash: ' + hash);
        } catch (e) {
            logger.error(nameFile + ` | redisModule | Unable to execute REDIS writing operation due to: ${e.message}`)
            console.error("Unable to execute REDIS writing operation due to ", e.message)
        }
    },
    writeAllRelations: async function (response, isEnabled) {
        if (!isEnabled) { return false }
        try {
            await client.hSet("RELATIONS", "relations", response);
        } catch (e) {
            logger.error(nameFile + ` | redisModule | Unable write relations in REDIS due to: ${e.message}`)
            console.error("Unable write relations in REDIS due to ", e.message)
        }
    },
    emptyCache: async function(isEnabled) {
        if (!isEnabled) { return false }
        logger.info(nameFile + ` | redisModule | Empty Cache`)
        try {
            await client.flushAll()
        } catch (e) {
            console.error("Unable to empty REDIS cache due to ", e.message)
            logger.error(nameFile + ` | redisModule |Unable to empty REDIS cache due to: ${e.message}`)
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
                let idsArray = await client.hGet(key, 'ids')
                let ids = idsArray.split(",")
                if (ids.some(idToDel => idsToInvalidate.includes(idToDel))) {
                    client.del(key)
                    logger.info(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                }
            }
            return
        } catch (e) {
            console.error("Unable invalidate REDIS cache due to ", e.message)
            logger.error(nameFile + ` | redisModule | Unable invalidate REDIS cache due to: ${e.message}`)
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
                    logger.info(nameFile + ` | redisModule | invalidating cache at key ${key}`)
                }
            }
            return
        } catch (e) {
            console.error("Unable invalidate REDIS cache due to ", e.message)
            logger.error(nameFile + ` | redisModule | Unable invalidate REDIS cache due to: ${e.message}`)
        }
    },
    updateCacheId: async function(idsToUpadate, indexesToUpdate, isEnable) {
        if (!isEnable) { return false }
        let idRelation = idsToUpadate[idsToUpadate.length - 1]
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                let relToCheck = JSON.parse(await client.hGet(key, "response"))
                let element = relToCheck.data.filter(data => data._id == idRelation)[0]
                if (!element) continue
                else {
                    element._id = idsToUpadate[2];
                    element._id1 = idsToUpadate[0];
                    element._index1 = indexesToUpdate[0];
                    element._id2 = idsToUpadate[1];
                    element._index2 = indexesToUpdate[1];
                }
                let newValue = JSON.stringify(relToCheck)
                await client.hSet(key, "response", newValue)
                logger.info(nameFile + ` | redisModule | Updated cache key: ${key}`)
            }
        } catch (e) {
            console.error(nameFile + ` | redisModule | Unable update cache due to:`, e)
            logger.error(nameFile + ` | redisModule | Unable update cache due to:`, e)
        }
        return;
    },
    addRelationCache: async function(ids, indexes, relationId, isEnble) {
        if (!isEnble) { return false }
        logger.info(nameFile + ` | redisModule | Creating new relation`)
        try {
            let key = "";
            let jsonResponse = "";
            let keys = await client.keys('*')
            for (let key_ of keys) {
                jsonResponse = JSON.parse(await client.hGet(key_, "response"))
                if (jsonResponse.data[0]._index == "entity_relation") {
                    key = key_;
                    break;
                }
            }
            let newRelation = {
                _index: "entity_relation",
                _type: "entity_relation",
                _id: relationId,
                score: null,
                sort: [
                    indexes[0]
                ],
                _id1: ids[0],
                _index1: indexes[0],
                _id2: ids[1],
                _index2: indexes[1]
            }
            jsonResponse.data.push(newRelation)
            let newValue = JSON.stringify(jsonResponse)
            await client.hSet(key, "response", newValue)
            logger.info(nameFile + ` | redisModule | New relation cached`)
        } catch (e) {
            console.error(nameFile + ` | redisModule | Unable add new relation in cache due to:`, e)
            logger.error(nameFile + ` | redisModule | Unable add new relation in cache due to:`, e)
        }
    },
    removeFromCacheById: async function(idsToDelete, isEnable) {
        if (!isEnable) { return false }
        logger.info(nameFile + ` | redisModule | Deleting relation`)
        let idRelation = idsToDelete[idsToDelete.length - 1]
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                let relToCheck = JSON.parse(await client.hGet(key, "response"))
                relToCheck.data = relToCheck.data.filter(data => data._id != idRelation)
                let newValue = JSON.stringify(relToCheck)
                await client.hSet(key, "response", newValue)
                logger.info(nameFile + ` | redisModule | Element removed`)
            }
        } catch (e) {
            console.error(nameFile + ` | redisModule | Unable delete cache due to:`, e)
            logger.error(nameFile + ` | redisModule | Unable delete cache due to:`, e)
        }
        return false
    }
}