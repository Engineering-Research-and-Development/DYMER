const util = require( '../utility' );
const jsonResponse = require( '../jsonResponse' );
const express = require( 'express' );
const router = express.Router();
const path = require('path');
const logger = require( "./dymerlogger" );
const fs = require( "fs" );
const multer = require( 'multer' );
const { Readable } = require( 'stream' );
const mongoose = require("mongoose");

const nameFile = path.basename( __filename );
const storage = multer.memoryStorage();
const upload = multer( { storage : storage } );

// Configurazione di Mongoose e connessione al database
try {
	mongoose.connect('mongodb://localhost:27017/dservice', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
} catch (e) {console.log("ERRORE ", e)}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Connected to MongoDB');
});

// Definizione del modello Mongoose
const librarySchema = new mongoose.Schema({
											  name     : String,
											  filename : String
});

const Library = mongoose.model('Library', librarySchema);

function bufferToStream( buffer ) {
	const stream = new Readable();
	stream.push( buffer );
	stream.push( null );
	return stream;
}

function saveFile( file, destinationPath ) {
	return new Promise( ( resolve, reject ) => {
		const fullPath = path.join( destinationPath, file.originalname );
		const readableStream = bufferToStream( file.buffer );
		const writableStream = fs.createWriteStream( fullPath );

		readableStream.pipe( writableStream );
		writableStream.on( 'finish', () => {
			writableStream.close();
			console.log( 'File salvato con successo:', fullPath );
			resolve();
		} );

		writableStream.on( 'error', ( err ) => {
			console.error( 'Errore durante il salvataggio del file:', err );
			reject( err );
		} );
	} );
}

function deleteFileAndDir(filePath, dirPath) {
	fs.unlink(filePath, function (err) {
		if (err && err.code == 'ENOENT') {
			// file doens't exist
			console.info("File doesn't exist, won't remove it.");
		} else if (err) {
			// other errors, e.g. maybe we don't have enough permission
			console.error("Error occurred while trying to remove file");
		} else {
			console.info(`removed`);
		}
	});

	const files = fs.readdirSync(dirPath)
	if (!files.length) {
		fs.rmdirSync(dirPath)
	} else {
		console.error("ERROR | " + nameFile + " | Directory path not found ", dirPath);
		logger.error(nameFile + ' | removeDir | Directory path not found  : ' + dirPath);
	}
}

//POST File
router.post( '/filelibrary', upload.single( 'file' ), async ( req, res ) => {
	// #swagger.tags = ['Webserver']
	const whatAndPath = "post/public/filelibrary/";

	if ( !req.file ) {
		return res.status( 400 ).send( 'No file uploaded' );
	}

	const absolutePath = path.resolve( __dirname, '..', 'public', 'cdn' );
	const destinationPath = path.join( absolutePath, req.body.path );

	try {
		if ( !fs.existsSync( destinationPath ) ) {
			fs.mkdirSync( destinationPath, { recursive : true } );
		}

		await saveFile( req.file, destinationPath );

		logger.info(
			`${ nameFile } | ${ whatAndPath } | Library [${ req.file.originalname }] has been successfully uploaded and saved!` );
		res.status( 201 )
		   .json( {
					  message : "Library js file has been successfully uploaded and saved!",
					  data    : req.file.originalname
				  } );
	} catch ( error ) {
		console.error( error.message, error );
		logger.error(
			`${ nameFile } | ${ origin } | Status ${ 500 } | ${ error.message } : ${ JSON.stringify( error ) }` );
		res.status( 500 ).json( { error : error.message } );
	}
} )

router.delete( '/filelibrary/:id', async ( req, res ) => {
	// #swagger.tags = ['Webserver']

	const whatAndPath = "delete/public/filelibrary/";

	const cdnAbsolutePath = path.resolve( __dirname, '..', 'public', 'cdn' );

	try {
		const library = await Library.findById( req.params.id ).lean()

		if ( !library ) {
			return res.status( 404 ).json( { error : 'Library not found' } );
		}

		const filePath = path.join( cdnAbsolutePath, library.filename.trim() );
		const dirPath = path.dirname( filePath );

		if ( !fs.existsSync( filePath ) ) {
			return res.status( 404 ).json( { error : 'File not found' } );
		}

		await deleteFileAndDir( filePath, dirPath );

		logger.info(
			`${ nameFile } | ${ whatAndPath } | Library [${ library.name }] has been deleted!` );
		res.status( 201 )
		   .json( {
					  message : "Library js file has been successfully deleted!",
					  data    : library.name
				  } );
	} catch ( error ) {
		console.error( error.message, error );
		logger.error(
			`${ nameFile } | ${ whatAndPath } | Status ${ 500 } | ${ error.message } : ${ JSON.stringify( error ) }` );
		res.status( 500 ).json( { error : error.message } );
	}
} )

/* GET home page. */

router.get('*', function (req, res, next) {
	// #swagger.tags = ['Webserver']

	var realPath = (req.originalUrl).split("?");
	//  console.log('*******************');
	//   console.log('richiesta 2', realPath[0]);
	console.log('req.originalUrl 2', req.originalUrl);
	var new__dirname = __dirname.replace('\routes', "")
	//   console.log('new__dirname', new__dirname);
	//  var fileLocationex = path.join(__dirname + "/../", realPath[0]);
	//  var temp__dirname = __dirname.replace("\routes", "");
	//   console.log('exrichiesta', fileLocationex);

	var fileLocation = path.join(new__dirname, "..", realPath[0].replace(util.getContextPath('webserver'), ""));
	//  var fileLocation = path.join(__dirname, "..", realPath[0]);
	// fileLocation = realPath[0];
	// var fileLocation = path.join(temp__dirname, realPath[0].replace(global.gConfig.services.webserver["context-path"], ""));
	//  console.log('realPath[0]', realPath[0]);
	//  fileLocation = realPath[0];
	console.log('risposta 2', fileLocation);
	res.sendFile(fileLocation);
});

module.exports = router;