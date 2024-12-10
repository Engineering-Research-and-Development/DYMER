const util = require( '../utility' );
const express = require( 'express' );
const router = express.Router();
const mongoose = require( "mongoose" );
const isValidObjectId = mongoose.isValidObjectId;
const path = require('path');
const nameFile = path.basename( __filename );
const logger = require( "./dymerlogger" );
const { Ollama } = require('ollama');
//const ollama = new Ollama({host: 'http://0.0.0.0:7869'})//if you run from ide

//TODO get dynamic host
const ollama = new Ollama({host: 'ollama:11434'})//containername, internal port

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
	const path = "/";
	try {

	} catch ( error ) {
		handleError( res, 500, error, error.message, path);
	}
} );

router.get('/query-test', async (req, res) => {
	try {
		const response = await ollama.chat({
			model: 'gemma2:2b',
			messages: [{ role: 'user', content: 'What you are?' }],
		});
		console.log(">>> ", response.message.content);
		res.json({ reply: response.message.content });
	} catch (error) {
		console.log("error ", error);
		res.status(500).send({ error: 'Error '+error.message });
	}
});


//TODO add control to check if current user is admin or is logged - util.checkIsAdmin, function(req, res
//TODO add control to check if data is empty

router.post('/query-model', async (req, res) => {
	//const { obj } = req.body;
	//console.log(">>>query ", obj);

	const data = req.body
	console.log(">>>>data ", data)

	try {
		const response = await ollama.chat({
			model: 'gemma2:2b',
			messages: [{ role: 'user', content: data.query }],
		});
		console.log(">>> ", response.message.content);
		res.json({ resp: response.message.content });
	} catch (error) {
		console.log("error ", error);
		res.status(500).send({ error: 'Error '+error.message });
	}
});

module.exports = router;
