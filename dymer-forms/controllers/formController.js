const mongoose = require("mongoose");
const { jsonResponse, getAllQuery, convertString } = require("../utils/utility");
const logger = require("../utils/logger");
const { getGridFSBucket, getDB } = require("../config/db");
const Model = mongoose.model("Form");
const cheerio = require("cheerio");

// Funzione per ottenere lo stato di MongoDB
const getMongoState = (req, res) => {
    const ret = new jsonResponse();
    const dbState = [
        { value: 0, label: "Disconnected", css: "text-danger" },
        { value: 1, label: "Connected", css: "text-success" },
        { value: 2, label: "Connecting", css: "text-info" },
        { value: 3, label: "Disconnecting", css: "text-warning" }
    ];
    const mongostate = mongoose.connection.readyState;
    ret.setMessages("Mongodb state");
    ret.setData(dbState.find(f => f.value === mongostate));
    ret.setSuccess(true);
    return res.status(200).send(ret);
};

// Funzione helper per recuperare i file da GridFS
const recFile = (file_id) => {
    return new Promise((resolve, reject) => {
        const gridFSBucket = getGridFSBucket();
        if (!gridFSBucket) {
            return reject(new Error("GridFSBucket non inizializzato."));
        }

        getDB().collection("fs.files").findOne(file_id._id, (err, filedata) => {
            if (err) return reject(err);
            if (!filedata) return reject(new Error("File non trovato in GridFS."));

            const chunks = [];
            const bucket = gridFSBucket.openDownloadStream(file_id);
            bucket.on("data", (chunk) => {
                chunks.push(chunk);
            });
            bucket.on("end", () => {
                let fbuf = Buffer.concat(chunks);
                if (!filedata.contentType.includes("image")) {
                    fbuf = fbuf.toString();
                }
                const attachment = {
                    filename: filedata.filename,
                    contentType: filedata.contentType,
                    data: fbuf,
                    md5: filedata.md5,
                    length: filedata.length,
                    uploadDate: filedata.uploadDate,
                    _id: filedata._id
                };
                resolve(attachment);
            });
            bucket.on("error", (error) => {
                logger.error(`Error in recFile for file_id ${file_id}: ${error.message}`);
                reject(error);
            });
        });
    });
};

// Funzione helper per ottenere array di file
const getFilesArrays = async (er) => {
    try {
        const actions = er.files.map(recFile);
        const dt = await Promise.all(actions);
        const ret_json = {
            _id: er._id,
            title: er.title,
            author: er.author,
            description: er.description,
            posturl: er.posturl,
            instance: er.instance,
            files: dt,
            created: er.created,
            properties: er.properties
        };
        if (er.structure) {
            ret_json.structure = er.structure;
        }
        return ret_json;
    } catch (error) {
        logger.error(`Error in getFilesArrays for er._id ${er._id}: ${error.message}`);
        throw error;
    }
};

// Funzione per estrarre i mapping dalla struttura HTML
const extractInteroperabilityMappings = (structure) => {
    const dcatMappings = {};
    const idsMappings = {};
    try {
        const $ = cheerio.load(structure);
        $("[data-dcat-map], [data-ids-map]").each(function() {
            const fieldName = $(this).attr("name");
            const dcatVal = $(this).attr("data-dcat-map");
            const idsVal = $(this).attr("data-ids-map");
            
            if (fieldName) {
                if (dcatVal) dcatMappings[fieldName] = dcatVal;
                if (idsVal) idsMappings[fieldName] = idsVal;
            }
        });
    } catch (e) {
        logger.error(`Errore parsing HTML per mapping: ${e.message}`);
    }
    return { dcatMappings, idsMappings };
};

// Funzione per gestire le rotte /modeldetail e /modeldetailwizard
const getModelDetail = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const callData = getAllQuery(req);
        const queryFind = callData.query;
        logger.info(`GET /modeldetail | queryFind: ${JSON.stringify(queryFind)}`);

        const Models = await Model.find(queryFind, {}, { title: 1, instance: 1, structure: 1 })
            .collation({ locale: "en" })
            .sort({ title: 1 });

        ret.setMessages("HTMLTemplate");
        ret.setData(Models);

        const formControlNodes = [];
        for (const item of ret.data) {
            if (item.structure) {
                const childNodes = item.structure.child || [];
                for (const node of childNodes) {
                    if (node.node === "element" && node.attr.class && node.attr.class.includes("form-control")) {
                        formControlNodes.push(node);
                    }
                }
            }
        }

        let templateNodeList = "";
        let templateHtml = "";

        formControlNodes.forEach((node) => {
            let name = node.attr.name;
            let tag = node.tag;
            let type = node.attr.type;
            name = convertString(name);
            let nodeType = type ? `type="${type}"` : "";
            templateNodeList += `<section class="container-fluid"> \n<div class="row  ">\n<div class="col-md-12 col-sx-12 col-lg-12">\n\t<div class="row"><h3 class="primaryColor primaryTitlesection"><b> ${name}</b></h3></div>\n <div class="row">{{ ${name} }}  </div>\n</div>\n</div> \n</section>\n`;
        });
        templateHtml = `<div data-component-entitystatus="" data-vvveb-disabled="" class="row">{{{EntityStatus this}}}</div> ${templateNodeList}\n`;
        ret.setMessages("HTML");
        ret.setData(templateHtml);

        return res.status(200).send(ret);
    } catch (error) {
        logger.error(`Error in getModelDetail: ${error.message}`, { stack: error.stack });
        next(error); // Passa l'errore al middleware di gestione errori
    }
};

// Funzione per creare un nuovo modello
const createModel = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const callData = getAllQuery(req);
        const data = callData.data;
        const files = req.files || [];

        logger.info(`POST /create | Data: ${JSON.stringify(data)} | Files: ${files.length}`);

        const newModel = new Model({
            title: data.title,
            author: data.author,
            description: data.description,
            posturl: data.posturl,
            instance: data.instance,
            files: files.map(file => file.id),
            structure: data.structure ? JSON.parse(data.structure) : undefined,
            properties: data.properties ? JSON.parse(data.properties) : undefined,
        });

        const savedModel = await newModel.save();
        logger.info(`Model created successfully: ${savedModel._id}`);

        ret.setMessages("Model Created");
        ret.setData(savedModel);
        return res.status(201).send(ret);
    } catch (error) {
        logger.error(`Error in createModel: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

// Funzione per aggiungere un asset a un modello esistente
const addAsset = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const callData = getAllQuery(req);
        const data = callData.data;
        const files = req.files || [];

        if (!data.pageId || files.length === 0) {
            ret.setSuccess(false);
            ret.setMessages("Parametri mancanti: pageId o file.");
            return res.status(400).send(ret);
        }

        const fileIds = files.map(file => file.id);
        const filter = { _id: data.pageId };
        const update = {
            $push: { files: { $each: fileIds } },
            $set: { "properties.changed": new Date().toISOString() }
        };

        const updatedModel = await Model.updateOne(filter, update);

        if (updatedModel.nModified === 0) {
            ret.setSuccess(false);
            ret.setMessages("Modello non trovato o nessun aggiornamento.");
            return res.status(404).send(ret);
        }

        logger.info(`Asset added to model ${data.pageId}. New files: ${fileIds.join(", ")}`);
        ret.setMessages("Asset Added");
        ret.setData({ pageId: data.pageId, newFileIds: fileIds });
        return res.status(200).send(ret);
    } catch (error) {
        logger.error(`Error in addAsset: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

// Funzione per aggiornare un modello esistente
const updateModel = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const callData = getAllQuery(req);
        const data = callData.data;

        if (!data.pageId) {
            ret.setSuccess(false);
            ret.setMessages("Parametro mancante: pageId.");
            return res.status(400).send(ret);
        }

        const filter = { _id: data.pageId };
        const update = {
            $set: {
                title: data.title,
                description: data.description,
                "properties.changed": new Date().toISOString() // Aggiorna la data di modifica
            }
        };

        const updatedModel = await Model.updateOne(filter, update);

        if (updatedModel.nModified === 0) {
            ret.setSuccess(false);
            ret.setMessages("Modello non trovato o nessun aggiornamento.");
            return res.status(404).send(ret);
        }

        logger.info(`Model ${data.pageId} updated successfully.`);
        ret.setMessages("Model Updated");
        ret.setData(data);
        return res.status(200).send(ret);
    } catch (error) {
        logger.error(`Error in updateModel: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

// Funzione per aggiornare la struttura di un modello (refactored)
const updateModelStructure = async (req, res, next) => {
    const ret = new jsonResponse();
    const endpointName = "POST /updatestructure";

    try {
        const callData = getAllQuery(req);
        const { pageId, structure, title } = callData.data || {};

        if (!pageId || !structure) {
            ret.setSuccess(false);
            ret.setMessages("Parametri mancanti: pageId o structure");
            return res.status(400).send(ret);
        }

        let processedStructure;
        try {
            processedStructure = (typeof structure === "string" && structure.startsWith("{")) 
                ? JSON.parse(structure) 
                : structure;
        } catch (e) {
            processedStructure = structure; // Fallback se non è una stringa JSON valida
        }

        const { dcatMappings, idsMappings } = extractInteroperabilityMappings(processedStructure);
        const hasMappings = Object.keys(dcatMappings).length > 0 || Object.keys(idsMappings).length > 0;

        const filter = { _id: pageId };
        const update = {
            $set: {
                structure: processedStructure,
                "interoperability.profiles.dcat.mappings": dcatMappings,
                "interoperability.profiles.ids.mappings": idsMappings,
                "interoperability.enabled": hasMappings,
                "interoperability.metadata.lastUpdate": new Date(),
                "properties.changed": new Date().toISOString() // Aggiorna la data di modifica
            }
        };

        await Model.updateOne(filter, update);

        logger.info(`${endpointName} | Modello aggiornato: ${title} (ID: ${pageId})`);
        ret.setMessages("Modello aggiornato con successo e mapping sincronizzati");
        return res.status(200).send(ret);

    } catch (err) {
        logger.error(`${endpointName} | Errore: ${err.message}`, { stack: err.stack });
        next(err);
    }
};

// Funzione per aggiornare un asset specifico all'interno di un modello
const updateAsset = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const callData = getAllQuery(req);
        const data = callData.data;
        const files = req.files || [];

        if (!data.pageId || !data.assetId || files.length === 0) {
            ret.setSuccess(false);
            ret.setMessages("Parametri mancanti: pageId, assetId o file.");
            return res.status(400).send(ret);
        }

        const newFileId = files[0].id;
        const filter = { _id: data.pageId };

        // Rimuovi il vecchio asset e aggiungi il nuovo in una singola operazione bulk
        const bulk = Model.collection.initializeOrderedBulkOp();
        bulk.find(filter).updateOne({ 
            $pull: { files: mongoose.Types.ObjectId(data.assetId) },
            $set: { "properties.changed": new Date().toISOString() }
        });
        bulk.find(filter).updateOne({ $push: { files: mongoose.Types.ObjectId(newFileId) } });
        await bulk.execute();

        const gridFSBucket = getGridFSBucket();
        if (gridFSBucket) {
            await gridFSBucket.delete(mongoose.Types.ObjectId(data.assetId));
            logger.info(`Old asset ${data.assetId} deleted from GridFS.`);
        }

        logger.info(`Asset ${data.assetId} in model ${data.pageId} updated to ${newFileId}.`);
        ret.setMessages("Asset Updated");
        ret.setExtraData({ newAssetId: newFileId });
        return res.status(200).send(ret);

    } catch (error) {
        logger.error(`Error in updateAsset: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

// Funzione per eliminare un modello
const deleteModel = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const { id } = req.params;
        const filter = { _id: id };

        const deletedModel = await Model.findOneAndDelete(filter);

        if (!deletedModel) {
            ret.setSuccess(false);
            ret.setMessages("Modello non trovato.");
            return res.status(404).send(ret);
        }

        const gridFSBucket = getGridFSBucket();
        if (gridFSBucket && deletedModel.files && deletedModel.files.length > 0) {
            for (const file of deletedModel.files) {
                await gridFSBucket.delete(mongoose.Types.ObjectId(file._id));
                logger.info(`Deleted file ${file._id} from GridFS.`);
            }
        }

        logger.info(`Model ${id} deleted successfully.`);
        ret.setMessages("Element deleted");
        return res.status(200).send(ret);
    } catch (error) {
        logger.error(`Error in deleteModel: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

// Funzione per eliminare un asset specifico da un modello
const deleteAsset = async (req, res, next) => {
    const ret = new jsonResponse();
    try {
        const { id, fid } = req.params;
        const filter = { _id: id };
        const update = { 
            $pull: { files: mongoose.Types.ObjectId(fid) },
            $set: { "properties.changed": new Date().toISOString() }
        };

        const updatedModel = await Model.updateOne(filter, update);

        if (updatedModel.nModified === 0) {
            ret.setSuccess(false);
            ret.setMessages("Modello non trovato o asset non presente.");
            return res.status(404).send(ret);
        }

        const gridFSBucket = getGridFSBucket();
        if (gridFSBucket) {
            await gridFSBucket.delete(mongoose.Types.ObjectId(fid));
            logger.info(`Asset ${fid} deleted from GridFS and model ${id}.`);
        }

        logger.info(`Asset ${fid} removed from model ${id}.`);
        ret.setMessages("Asset deleted");
        return res.status(200).send(ret);
    } catch (error) {
        logger.error(`Error in deleteAsset: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

module.exports = {
    getMongoState,
    getModelDetail,
    createModel,
    addAsset,
    updateModel,
    updateModelStructure,
    updateAsset,
    deleteModel,
    deleteAsset,
    // Esporta anche le funzioni helper se necessario per test o altri usi
    recFile,
    getFilesArrays,
    extractInteroperabilityMappings
};
