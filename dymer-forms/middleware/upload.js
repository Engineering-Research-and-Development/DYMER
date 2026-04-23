const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const { mongoUrl } = require("../utils/utility");
const logger = require("../utils/logger");

let uploadMiddleware;

const initUploadMiddleware = () => {
    const mongoURI = mongoUrl();
    const storage = new GridFsStorage({
        url: mongoURI,
        file: (req, file) => {
            return new Promise((resolve, reject) => {
                const fileInfo = {
                    filename: file.originalname,
                    bucketName: "fs"
                };
                resolve(fileInfo);
            });
        }
    });
    uploadMiddleware = multer({ storage: storage }).any();
    logger.info("Multer GridFsStorage initialized.");
};

const getUploadMiddleware = () => {
    if (!uploadMiddleware) {
        initUploadMiddleware();
    }
    return uploadMiddleware;
};

module.exports = { initUploadMiddleware, getUploadMiddleware };
