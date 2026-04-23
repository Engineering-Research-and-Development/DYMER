const mongoose = require('mongoose');
const util = require('../utils/utility');
const logger = require('../utils/logger');

let db;
let gridFSBucket;
let upload;

const connectDB = async () => {
    const mongoURI = util.mongoUrl();
    logger.info(`Attempting to connect to MongoDB at: ${mongoURI}`);

    try {
        const x = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
        gridFSBucket = new mongoose.mongo.GridFSBucket(x.connections[0].db, {
            bucketName: "fs"
        });
        logger.info("GridFSBucket initialized.");
        return { db, gridFSBucket };
    } catch (err) {
        logger.error(`Error connecting to mongo! Database name: "${mongoURI}"`, err);
        process.exit(1); // Exit process on database connection failure
    }
};

const getDB = () => db;
const getGridFSBucket = () => gridFSBucket;

module.exports = { connectDB, getDB, getGridFSBucket };
