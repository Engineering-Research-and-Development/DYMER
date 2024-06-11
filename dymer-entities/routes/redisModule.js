const redis = require('redis')
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
var crypto = require('crypto');
var jsonResponse = require('../jsonResponse');

let client;

module.exports = {
    relationsKey: "",
    init: async function (isEnabled) {
        if (!isEnabled) { return false }
        client = redis.createClient({
            socket: {
                host: global.configService.cache.host,
                port: global.configService.cache.port
            },
            password: global.configService.cache.password
        });
        client.on('error', (err) => {
            logger.error(nameFile + ` | init | REDIS connection lost due to: ${err.message}`)
            console.error('REDIS connection lost due to: ', err.message);
            this.disconnect(isEnabled)
        });
        try {
            await client.connect();
            global.configService.cache.isEnabled = true;
            logger.info(nameFile + ` | init | Connected to REDIS!`)
        } catch (e) {
            logger.error(nameFile + ` | init | Unable to connect to REDIS due to: ${e.message}`)
            console.error("Unable to connect to REDIS due to ", e.message)
        }
        return;
    },
    disconnect: async function (isEnabled) {
        if (!isEnabled) { return false }
        logger.info(nameFile + ` | redis Module Disconnecting...`)
        try {
            await client.disconnect();
            global.configService.cache.isEnabled = false;
            logger.info(nameFile + ` | disconnect | Disconnected to REDIS!`)
        } catch (error) {
            logger.error(nameFile + ` | disconnect | Unable to disconnect from REDIS due to: ${error.message}`)
            console.error("Unable to disconnect from REDIS due to ", error.message)
        }
        return;
    },
    ping: async function () {
        let pingResp = await client.ping()
        return (pingResp == "PONG");
    },
    cancelKey: async function (keys, isEnabled) {
        if (!isEnabled) { return false }
        if (Array.isArray(keys)) {
            for (let key of keys) {
                try {
                    await client.del(key)
                } catch (e) {
                    logger.error(nameFile + ` | cancelKey | Unable remove key ${key} in REDIS due to: ${e.message}`)
                    console.error(`Unable remove key ${key} in REDIS due to: ${e.message}`)
                }
            }
        } else {
            try {
                await client.del(keys)
            } catch (e) {
                logger.error(nameFile + ` | cancelKey | Unable remove key ${keys} in REDIS due to: ${e.message}`)
                console.error(`Unable remove key ${keys} in REDIS due to: ${e.message}`)
            }
        }
    },
    readCacheByKey: async function (query, isEnabled) {
        if (!isEnabled) { return null }
        let hash = await this.calculateHash(query)
        let resp = {}
        try {
            resp = await client.hGet(hash, "response")
            let userIdcache = await client.hGet(hash, "userId")
            logger.info(nameFile + ' | readCacheByKey | userIdcache, reading cache hash: ' + userIdcache + ' , ' + hash);
            let response = JSON.parse(resp)
            return response
        } catch (e) {
            return null
        }
    },
    getkeysByRoles: async function (role, isEnable) {
        // per ogni ruolo in roles cerca le chiavi che lo contengono
        if (!isEnable) { return false }
        logger.info(nameFile + ` | getkeysByRoles | Finding keys`)
        let keyToInvalidate = [];
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                if (key == this.relationsKey || key == "") { continue; }
                let rolesPerKey = JSON.parse((await client.hGet(key, 'roles')))
                if (rolesPerKey.includes(role)) {
                    keyToInvalidate.push(key)
                }
            }
            //  console.log(keyToInvalidate, keyToInvalidate.length)
        } catch (e) {
            console.error(`Unable to find REDIS cache by roles due to: ${e.message}`)
            logger.error(nameFile + ` | invalidateCacheByIndex | Unable to find REDIS cache by roles due to: ${e.message}`)
        }
        return keyToInvalidate;
    },
    writeCacheByKey: async function (query, dymerUser, origin, response, ids, indexes, typeservice, isEnabled) {
        if (!isEnabled) { return false }

        let hash = await this.calculateHash(query)
        try {
            await client.hSet(hash, "query", hash);
            await client.hSet(hash, "userId", dymerUser.id);
            await client.hSet(hash, "roles", JSON.stringify(dymerUser.roles)); //
            await client.hSet(hash, "origin", origin);
            await client.hSet(hash, "response", response);
            await client.hSet(hash, "typeservice", typeservice);
            await client.hSet(hash, "ids", ids);
            await client.hSet(hash, "indexes", indexes);
            console.log(nameFile + ' | writeCacheByKey | writing cache hash: ' + hash);
            logger.info(nameFile + ' | writeCacheByKey | writing cache hash: ' + hash);
        } catch (e) {
            logger.error(nameFile + ` | writeCacheByKey | Unable to execute REDIS writing key ${hash} operation due to: ${e.message}`)
            console.error(`Unable to execute REDIS writing key ${hash} operation due to: ${e.message} `)
        }
    },
    writeAllRelations: async function (response, query, isEnabled) {
        if (!isEnabled) { return false }
        await this.setRelationKey(query)

        let hash = await this.getRelationKey()
        try {
            await client.hSet(hash, "response", response);
            console.log(nameFile + ' | writeAllRelations ');
            logger.info(nameFile + ' | writeAllRelations ');
        } catch (e) {
            logger.error(nameFile + ` | writeAllRelations | Unable to execute REDIS writing key ${hash} operation due to: ${e.message}`)
            console.error(`Unable to execute REDIS writing key ${hash} operation due to: ${e.message} `)
        }
    },
    readAllrelations: async function (hash, listIds, isEnabled) {        
        if (!isEnabled) { return null }
        try {
            let relations = JSON.parse(await client.hGet(hash, "response"))
            relations = relations.data.filter((item) => ((listIds.includes(item["_source"]["_id1"] )) || (listIds.includes(item["_source"]["_id2"])))); /**/
            return relations
        } catch (e) {
            console.error(`Unable to retrive all relations REDIS cache key ${hash} due to `, e.message)
            logger.error(nameFile + ` | readAllrelations |Unable to retrive all relations cache key ${hash} due to: ${e.message}`)
            return []
        }
    },
    emptyCache: async function (isEnabled) {
        if (!isEnabled) { return false }
        logger.info(nameFile + ` | emptyCache | Empty Cache`)
        try {
            await client.flushAll()
        } catch (e) {
            console.error("Unable to empty REDIS cache due to ", e.message)
            logger.error(nameFile + ` | emptyCache |Unable to empty REDIS cache due to: ${e.message}`)
        }
    },
    calculateHash: async function (query) {
        return crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
    },
    extractIds: async function (ret, isEnabled) {
        if (!isEnabled) { return false }
        let entitiesIds = [...new Set(ret.data.map(obj => obj._id))]
        let relationsIds = await this.extractIdsRelations(ret)
        let ids = entitiesIds.concat(relationsIds)
        return ids;
    },
    extractIdsRelations: async function (ret) {
        return [...new Set(ret.data.reduce((ids, curr) => {
            if (curr.relations) {
                return ids.concat(curr.relations.map(r => r._id))
            } else {
                return ids
            }
        }, []))]
    },
    extractIndexes: async function (ret, isEnabled) {
        if (!isEnabled) { return false }
        let entitiesIndexes = [...new Set(ret.data.map(obj => obj._index))]
        let relationsIndex = await this.extractIndexRelations(ret)
        let indexes = entitiesIndexes.concat(relationsIndex)
        return indexes
    },
    extractIndexRelations: async function (ret) {
        return [...new Set(ret.data.reduce((indexes, curr) => {
            if (curr.relations) {
                return indexes.concat(curr.relations.map(r => r._index))
            } else {
                return indexes
            }
        }, []))]
    },
    invalidateCacheById: async function (idsToInvalidate, isEnabled) {
        if (!isEnabled) { return false }
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                if (key == this.relationsKey) { continue; }
                let idsArray = await client.hGet(key, 'ids')
                let ids = idsArray.split(",")
                if (ids.some(idToDel => idsToInvalidate.includes(idToDel))) {
                    client.del(key)
                    logger.info(nameFile + ` | invalidateCacheById | invalidating cache at key ${key}`)
                   
                }
            }
            return
        } catch (e) {
            console.error("Unable invalidate REDIS cache by ID due to ", e.message)
            logger.error(nameFile + ` | invalidateCacheById | Unable invalidate REDIS cache by ID due to: ${e.message}`)
        }
    },
    invalidateCacheByIndex: async function (index, isEnabled) {
        if (!isEnabled) { return false }
        try {
            let keys = await client.keys('*')
            for (let key of keys) {
                if (key == this.relationsKey || key == "") { continue; }
                let indexesArray = (await client.hGet(key, 'indexes'))
                let indexes = indexesArray.split(",")
                if (indexes && indexes.find(indexToDel => indexToDel == index)) {
                    client.del(key)
                    logger.info(nameFile + ` | invalidateCacheByIndex | invalidating cache at key ${key}`)
                    console.log(nameFile + ` | invalidateCacheByIndex | invalidating cache at key ${key}`)
                }
            }
            return
        } catch (e) {
            console.error(`Unable invalidate REDIS cache by index at key due to: ${e.message}`)
            logger.error(nameFile + ` | invalidateCacheByIndex | Unable invalidate REDIS cache by index due to: ${e.message}`)
        }
    },
    updateRelationsCacheById: async function (idsToUpadate, idRelation, indexesToUpdate, isEnable) {
        if (!isEnable) { return false }
        try {
            let relations = await client.hGet(this.relationsKey, "response")
            let relationsJSON = JSON.parse(relations)
            let relationToUpdateIndex = relationsJSON.data.findIndex(r => r._id == idRelation)
            relationsJSON.data[relationToUpdateIndex]._id = idRelation;
            relationsJSON.data[relationToUpdateIndex]._source._id1 = idsToUpadate[0];
            relationsJSON.data[relationToUpdateIndex]._source._index1 = indexesToUpdate[0];
            relationsJSON.data[relationToUpdateIndex]._source._id2 = idsToUpadate[1];
            relationsJSON.data[relationToUpdateIndex]._source._index2 = indexesToUpdate[1];
            await client.hSet(this.relationsKey, "response", JSON.stringify(relationsJSON))
        }catch (e) {
            console.error(nameFile + ` | updateRelationsCacheById | Unable update cache due to:`, e)
            logger.error(nameFile + ` | updateRelationsCacheById | Unable update cache due to:` + e)
        }
        return;
    },
    addRelationCache: async function (ids, indexes, relationId, isEnble) {
        if (!isEnble) { return false }
        logger.info(nameFile + ` | addRelationCache | Creating new relation`)
        try {
            let key = this.relationsKey;
            let jsonResponse_ = new jsonResponse();
            jsonResponse_ = JSON.parse(await client.hGet(key, "response"))

            let newRelation = {
                _index: "entity_relation",
                //_type: "entity_relation",
                _id: relationId,
                score: null,
                sort: [
                    indexes[0]
                ],
                _source: {
                    _id1: ids[0],
                    _index1: indexes[0],
                    _id2: ids[1],
                    _index2: indexes[1]
                }
            }

            //console.log("newRelation", newRelation)

            jsonResponse_.data.push(newRelation)
            let newValue = JSON.stringify(jsonResponse_)
            await client.hSet(key, "response", newValue)
            logger.info(nameFile + ` | addRelationCache | New relation cached`+ JSON.stringify(newRelation))
        } catch (e) {
            console.error(nameFile + ` | addRelationCache | Unable add new relation in cache at key ${key} due to:`, e)
            logger.error(nameFile + ` | addRelationCache | Unable add new relation in cache at key ${key} due to:` + e)
        }
    },
    removeRelationsFromCacheById: async function (ids_, isEnable) {
        if (!isEnable) { return false }
        //  console.log("REDIS | removeRelationsFromCacheById | ids_ ", ids_)
        logger.info(nameFile + ` | removeRelationsFromCacheById | Deleting relation`)
        try {
            let relToCheck = JSON.parse(await client.hGet(this.relationsKey, "response"))
            if (ids_.length == 2) {
                relToCheck.data = relToCheck.data.filter((data) => !((data._source._id1 == ids_[0] && data._source._id2 == ids_[1]) || (data._source._id1 == ids_[1] && data._source._id2 == ids_[0])))
            } else {
                relToCheck.data = relToCheck.data.filter((data) => !((data._source._id1 == ids_[0]) || (data._source._id2 == ids_[0])))
            }
            let newValue = JSON.stringify(relToCheck)
            await client.hSet(this.relationsKey, "response", newValue)
            logger.info(nameFile + ` | removeRelationsFromCacheById | Element removed`+ids_)
            logger.info(nameFile + ` | removeRelationsFromCacheById | aggiornata`+ this.relationsKey) 
        } catch (e) {
            console.error(nameFile + ` | removeRelationsFromCacheById | Unable delete cache key ${this.relationsKey} due to:`, e)
            logger.error(nameFile + ` | removeRelationsFromCacheById | Unable delete cache key ${this.relationsKey} due to:` + e)
        }
        return false
    },
    removeRelationsFromCacheByIndex: async function (index, isEnable) {
        if (!isEnable) { return false }
        logger.info(nameFile + ` | removeRelationsFromCacheByIndex | removeRelationsFromCacheByIndex | Deleting relation`)
        try {
            let relToCheck = JSON.parse(await client.hGet(this.relationsKey, "response"))

            relToCheck.data = relToCheck.data.filter((data) => !((data._source._index1 == index) || (data._source._index2 == index)))

            let newValue = JSON.stringify(relToCheck)
            await client.hSet(key, "response", newValue)
            logger.info(nameFile + ` | removeRelationsFromCacheByIndex | Relations with ${index} removed`)

        } catch (e) {
            console.error(nameFile + ` | removeRelationsFromCacheByIndex | Unable delete ${index} relations due to: ${e}`)
            logger.error(nameFile + ` | removeRelationsFromCacheByIndex | Unable delete ${index} relations due to: ${e}`)
        }
        return false
    },
    setRelationKey: async function (query) {
        this.relationsKey = await this.calculateHash(query)
    },
    getRelationKey: async function () {
        return this.relationsKey
    }
}