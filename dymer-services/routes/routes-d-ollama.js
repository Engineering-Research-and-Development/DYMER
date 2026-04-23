const util = require( '../utility' );
const express = require( 'express' );
const router = express.Router();
const mongoose = require( "mongoose" );
const isValidObjectId = mongoose.isValidObjectId;
const path = require('path');
const nameFile = path.basename( __filename );
const logger = require( "./dymerlogger" );
const { Ollama } = require('ollama');
const axios = require('axios');

//const ollama = new Ollama({host: 'http://0.0.0.0:7869'})//if you run from ide

 
const ollama = new Ollama({host: 'http://0.0.0.0:7869'}) 

//const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

const OLLAMA_URL =   'http://0.0.0.0:7869';

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
			model: 'codegemma:2b',
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
			model: 'codegemma:2b',
			messages: [{ role: 'user', content: data.query }],
		});
		console.log(">>> ", response.message.content);
		res.json({ resp: response.message.content });
	} catch (error) {
		console.log("error ", error);
		res.status(500).send({ error: 'Error '+error.message });
	}
});



router.post('/generate-code', async (req, res) => {

    //const { prompt } = req.body;
	const { prompt, model } = req.body;
      console.log("chiamato endpoint",{ prompt });
	   console.log("chiamato endpoint model",{ model });
    //  console.log(">>>>req ", req)
      
      
      
    if (!prompt) {
        return res.status(400).json({ error: 'Il prompt è obbligatorio.' });
    }

    try {
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
			/*MG - MAGIC AI della nuova GUI - INIZIO*/
            model: model || 'llama3.1', // Usa quello ricevuto o il default
      		prompt: prompt,
       		stream: false,
			//model:'codegemma:2b', 
			/*MG - MAGIC AI della nuova GUI - FINE*/
            options: {
                // Puoi aggiungere opzioni qui, ad esempio per la temperatura, il top_k, ecc.
                // temperature: 0.7,
                // top_k: 40,
            }
        });

        // La risposta di Ollama contiene il campo 'response' con il testo generato
        const generatedCode = response.data.response;

        res.json({ success: true, generatedCode: generatedCode });

		console.log("Codice generato ricevuto da Ollama:", generatedCode);

    } catch (error) {
        console.error('Errore durante la comunicazione con Ollama:', error.message);
        if (error.response) {
            console.error('Dettagli errore Ollama:', error.response.data);
            return res.status(error.response.status).json({
                error: 'Errore dalla API di Ollama',
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// GET: Verifica se Ollama è online
router.get('/status', async (req, res) => {
    try {
        await ollama.list();
        res.json({ success: true, status: 'online' });
    } catch (error) {
        res.status(503).json({ success: false, status: 'offline', details: error.message });
    }
});

// GET: Lista modelli installati
router.get('/models', async (req, res) => {
    try {
        const response = await ollama.list();
        res.json({ success: true, models: response.models });
    } catch (error) {
        handleError(res, 500, error, "Errore recupero modelli", "/models");
    }
});

// POST: Scarica un nuovo modello (Pull)
router.post('/pull-model', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'Nome modello mancante' });

    try {
        // Nota: il pull può richiedere tempo, ollama-js supporta lo streaming 
        // ma qui lo gestiamo come operazione atomica per semplicità
        await ollama.pull({ model: modelName });
        res.json({ success: true, message: `Modello ${modelName} scaricato con successo` });
    } catch (error) {
        handleError(res, 500, error, "Errore durante il download del modello", "/pull-model");
    }
});

module.exports = router;
