var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const path = require('path');
const logger = require( "./dymerlogger" );
const fs = require( "fs" );
const multer = require( 'multer' );
const { Readable } = require( 'stream' );

const nameFile = path.basename( __filename );
const storage = multer.memoryStorage();
const upload = multer( { storage : storage } );

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

function deleteFile(filePath) {

/* 	fs.unlink(filePath, (err) => {
		if (err) {
			console.error(`Errore durante la cancellazione del file ${filePath}:`, err);
		} else {
			console.log(`File ${filePath} cancellato con successo.`);
		}
	}); */

	fs.unlink(filePath, (err) => {
		if (err) {
			console.error("Errore durante l'eliminazione del file:", err);
			return;
		}

		console.log('File eliminato correttamente:', filePath);

		// Elimina la cartella vuota
		fs.rmdir(path.dirname(filePath), (err) => {
			if (err) {
				if (err.code === 'ENOENT') {
					console.log('La cartella è già vuota o non esiste.');
				} else {
					console.error("Errore durante l'eliminazione della cartella:", err);
				}
				return;
			}

			console.log('Cartella eliminata correttamente:', path.dirname(filePath));
		});
	});
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

router.delete( '/filelibrary/:filename', async ( req, res ) => {
	// #swagger.tags = ['Webserver']

	const whatAndPath = "delete/public/filelibrary/";

	const cdnAbsolutePath = path.resolve( __dirname, '..', 'public', 'cdn' );
	const filePath = path.join( cdnAbsolutePath, req.params.filename );

	try {
		await deleteFile( filePath );

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