const util = require( '../utility' );
const express = require( 'express' );
const router = express.Router();
const mongoose = require( "mongoose" );
const isValidObjectId = mongoose.isValidObjectId;
const DymRule = require( '../models/permission/Libraries' );

function handleError( res, error, message ) {
	console.error( message, error );
	res.status( 500 ).json( { error : message } );
}

router.use( express.json( { limit : '50mb', extended : true } ) );
router.use( express.urlencoded( { limit : '100mb', extended : true } ) );

// POST
router.post( '/', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> POST: [${ req.body }]` );
	try {
		const { name, domtype, filename, callback, useonload, group, activated, loadtype, mandatory } = req.body;

		// Crea una nuova istanza del modello Libraries con i dati ricevuti dalla richiesta
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

		res.status( 201 ).json( { message: "New librery added successfully", data: savedLibrary } );
	} catch ( error ) {
		handleError( res, error, error.message );
	}
} );

// GET ALL
// TODO indagare sul perché con util.checkIsAdmin la pagina di test "dymer_list_detail_one_page.html" non funzionava
router.get( '/', /* util.checkIsAdmin,  */async ( req, res ) => {
	// console.log( "router-d-library -> GET all" );
	try {
		const libraries = await DymRule.find();
		res.json( libraries );
	} catch ( error ) {
		handleError( res, error, "Errore nel recupero della configurazione delle librerie:" );
	}
} );

// GET by ID
router.get( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> GET id: [${ req.params.id }]` );
	const libId = req.params.id;

	if ( !isValidObjectId( libId ) ) {
		return res.status( 400 ).json( { error : 'ID non valido' } );
	}

	try {
		const library = await DymRule.findById( libId );

		if ( !library ) {
			return res.status( 404 ).json( { error : 'Libreria non trovata' } );
		}

		res.json( library );
	} catch ( error ) {
		handleError( res, error, "Errore nel recupero della libreria:" );
	}
} );

// PUT
router.put( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> PUT id: [${ req.params.id }]` );
	const libId = req.params.id;

	if ( !isValidObjectId( libId ) ) {
		return res.status( 400 ).json( { error : 'ID non valido' } );
	}

	try {
		const idFilter = { _id : libId };
		const updateLibrary = { $set : req.body };

		const result = await DymRule.updateOne( idFilter, updateLibrary );

		if ( result.modifiedCount < 1 ) {
			res.status( 404 ).json( { error : 'Libreria non trovata o stato non modificato' } );
		} else {
			res.json( { message : 'Stato della libreria aggiornato con successo' } );
		}
	} catch ( error ) {
		handleError( res, error, "Errore nell'aggiornamento dello stato della libreria:" );
	}
} );

// PATCH
router.patch( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log(`router-d-library -> PATCH id: [${req.params.id}]`);
	const libId = req.params.id;

	if ( !isValidObjectId( libId ) ) {
		return res.status( 400 ).json( { error : 'ID non valido' } );
	}

	try {
		const updatedLibrary = await DymRule.findOneAndUpdate( { _id : libId }, { $set : req.body }, { new : true } );

		if ( !updatedLibrary ) {
			return res.status( 404 ).json( { error : 'Libreria non trovata o stato non modificato' } );
		}

		res.json( { message : 'Stato della libreria aggiornato con successo', library : updatedLibrary } );
	} catch ( error ) {
		handleError( res, error, "Errore nell'aggiornamento dello stato della libreria:" );
	}
} );

// DELETE
router.delete( '/:id', util.checkIsAdmin, async ( req, res ) => {
	// console.log( `router-d-library -> DELETE id: [${ req.params.id }]` );
	const libId = req.params.id;

	if ( !isValidObjectId( libId ) ) {
		return res.status( 400 ).json( { error : 'ID non valido' } );
	}

	try {
		const result = await DymRule.deleteOne( { _id : libId } );

		if ( result.deletedCount < 1 ) {
			res.status( 404 ).json( { error : 'Libreria non trovata' } );
		} else {
			res.json( { message : 'Libreria eliminata con successo' } );
		}
	} catch ( error ) {
		handleError( res, error, "Errore nella cancellazione della libreria:" );
	}
} );

module.exports = router;