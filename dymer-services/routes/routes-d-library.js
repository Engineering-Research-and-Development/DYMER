const util = require( '../utility' );
const express = require( 'express' );
const router = express.Router();
const mongoose = require( "mongoose" );
const isValidObjectId = mongoose.isValidObjectId;
const DymRule = require( '../models/permission/Libraries' );
const path = require( 'path' );
const nameFile = path.basename( __filename );
const logger = require( "./dymerlogger" );

function handleError( res, status, error, message, origin ) {
	console.error( message, error );
	logger.error( `${ nameFile } | ${ origin } | Status ${ status } | ${ error.message } : ${ JSON.stringify( error ) }` );
	res.status( status ).json( { error : message } );
}

function errorStringify( status, origin, message ) {
	return { "status" : status, "origin" : origin, "message" : message }
}

router.use( express.json( { limit : '50mb', extended : true } ) );
router.use( express.urlencoded( { limit : '100mb', extended : true } ) );

// POST
router.post( '/', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> POST: [${ req.body }]` );
	let whatAndPath = "post/library/";
	try {
		let { name, domtype, filename, callback, useonload, group, activated, loadtype, mandatory } = req.body;
		const newLibrary = new DymRule( {
											name,
											domtype,
											filename,
											callback,
											useonload,
											group,
											activated,
											loadtype,
											mandatory
										} );
		// Salva la nuova libreria nel database
		const savedLibrary = await newLibrary.save();

		logger.info( `${ nameFile } | ${ whatAndPath } | New library added successfully: ${ JSON.stringify( savedLibrary ) }` );
		res.status( 201 ).json( { message : "New library added successfully", data : savedLibrary } );
	} catch ( error ) {
		handleError( res, 500, error, error.message, whatAndPath );
	}
} );

// GET ALL
// TODO indagare sul perché con util.checkIsAdmin la pagina di test "dymer_list_detail_one_page.html" non funzionava
router.get( '/', /* util.checkIsAdmin,  */async ( req, res ) => {
	// console.log( "router-d-library -> GET all" );
	let whatAndPath = "getAll/library/";
	try {
		const libraries = await DymRule.find();
		logger.info( `${ nameFile } | ${ whatAndPath } | Fetched all libraries: ${ JSON.stringify( libraries ) }` );
		res.json( libraries );
	} catch ( error ) {
		handleError( res, 500, error, "Error retrieving library configuration: ", whatAndPath );
	}
} );

// GET by ID
router.get( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> GET id: [${ req.params.id }]` );
	const libId = req.params.id;
	let whatAndPath = "getById/library/:id";

	if ( !isValidObjectId( libId ) ) {
		let status = 400;
		let message = `[${ libId }] invalid ID`;
		let error = errorStringify( status, whatAndPath, message );
		return handleError( res, status, error, message, whatAndPath );
	}

	try {
		const library = await DymRule.findById( libId );

		if ( !library ) {
			let status = 404;
			let message = `Library [${ libId }] not found`;
			let error = errorStringify( status, whatAndPath, message );
			return handleError( res, status, error, message, whatAndPath );
		}
		logger.info( `${ nameFile } | ${ whatAndPath } | Found library [${ libId }]: ${ JSON.stringify( library ) }` );
		res.json( library );
	} catch ( error ) {
		handleError( res, 500, error, "Error fetching library: ", whatAndPath );
	}
} );

// PUT
router.put( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> PUT id: [${ req.params.id }]` );
	const libId = req.params.id;
	let whatAndPath = "put/library/:id";

	if ( !isValidObjectId( libId ) ) {
		let status = 400;
		let message = `[${ libId }] invalid ID`;
		let error = errorStringify( status, whatAndPath, message );
		return handleError( res, status, error, message, whatAndPath );
	}

	try {
		const idFilter = { _id : libId };
		const updateLibrary = { $set : req.body };

		const result = await DymRule.updateOne( idFilter, updateLibrary );

		if ( result.modifiedCount < 1 ) {
			let status = 404;
			let message = `Library [${ libId }] not found or state not changed`;
			let error = errorStringify( status, whatAndPath, message );
			return handleError( res, status, error, message, whatAndPath );
		} else {
			logger.info( `${ nameFile } | ${ whatAndPath } | Library [${ libId }] updated successfully: ${ JSON.stringify( result ) }` );
			res.json( { message : `Library [${ libId }] updated successfully`, library : result } );
		}
	} catch ( error ) {
		handleError( res, 500, error, "Error updating library status: ", whatAndPath );
	}
} );

// PATCH
router.patch( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log(`router-d-library -> PATCH id: [${req.params.id}]`);
	const libId = req.params.id;
	let whatAndPath = "patch/library/:id";

	if ( !isValidObjectId( libId ) ) {
		let status = 400;
		let message = `[${ libId }] invalid ID`;
		let error = errorStringify( status, whatAndPath, message );
		return handleError( res, status, error, message, whatAndPath );
	}

	try {
		const updatedLibrary = await DymRule.findOneAndUpdate( { _id : libId }, { $set : req.body }, { new : true } );

		if ( !updatedLibrary ) {
			let status = 404;
			let message = `Library [${ libId }] not found or state not modified`;
			let error = errorStringify( status, whatAndPath, message );
			return handleError( res, status, error, message, whatAndPath );
		}

		logger.info( `${ nameFile } | ${ whatAndPath } | Library [${ libId }] updated successfully: ${ JSON.stringify( updatedLibrary ) }` );
		res.json( { message : `Library [${ libId }] updated successfully`, library : updatedLibrary } );
	} catch ( error ) {
		handleError( res, 500, error, "Error updating library status: ", whatAndPath );
	}
} );

// DELETE
router.delete( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> DELETE id: [${ req.params.id }]` );
	const libId = req.params.id;
	let whatAndPath = "delete/library/:id";

	if ( !isValidObjectId( libId ) ) {
		let status = 400;
		let message = `[${ libId }] invalid ID`;
		let error = errorStringify( status, whatAndPath, message );
		return handleError( res, status, error, message, whatAndPath );
	}

	try {
		const result = await DymRule.deleteOne( { _id : libId } );

		if ( result.deletedCount < 1 ) {
			let status = 404;
			let message = `Library [${ libId }] not found`;
			let error = errorStringify( status, whatAndPath, message );
			return handleError( res, status, error, message, whatAndPath );
		} else {
			logger.info( `${ nameFile } | ${ whatAndPath } | Library [${ libId }] successfully deleted` );
			res.json( { message : `Library [${ libId }] successfully deleted` } );
		}
	} catch ( error ) {
		handleError( res, 500, error, "Error deleting library: ", whatAndPath );
	}
} );

module.exports = router;