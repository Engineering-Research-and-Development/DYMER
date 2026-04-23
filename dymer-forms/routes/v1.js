const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const { checkIsDymerUser, checkIsAdmin } = require("../middleware/auth");
const { getUploadMiddleware } = require("../middleware/upload");
const bodyParser = require("body-parser");

// Middleware per il parsing del body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Inizializza il middleware di upload (necessario prima di usarlo nelle rotte)
// Questo dovrebbe essere chiamato una volta all'avvio dell'applicazione
// getUploadMiddleware(); // Chiamato nel server.js o app.js

// Rotte pubbliche
router.get("/mongostate", formController.getMongoState);

// Rotte che richiedono autenticazione (es. DymerUser)
router.get("/modeldetail", checkIsDymerUser, formController.getModelDetail);
router.get("/modeldetailwizard", checkIsDymerUser, formController.getModelDetail);

// Rotte che richiedono autenticazione e upload (es. Admin)
router.post("/create", checkIsAdmin, getUploadMiddleware(), formController.createModel);
router.post("/addAsset", checkIsAdmin, getUploadMiddleware(), formController.addAsset);
router.post("/update", checkIsAdmin, getUploadMiddleware(), formController.updateModel);
router.post("/updatestructure", checkIsAdmin, getUploadMiddleware(), formController.updateModelStructure);
router.post("/updateAsset", checkIsAdmin, getUploadMiddleware(), formController.updateAsset);

// Rotte che richiedono autenticazione per l'eliminazione
router.delete("/:id", checkIsAdmin, formController.deleteModel);
router.delete("/:id/:fid", checkIsAdmin, formController.deleteAsset);

module.exports = router;
