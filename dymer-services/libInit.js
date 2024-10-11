const mongoose = require( "mongoose" );
const dataToInsert = require( './config/coreLibraries.json' );

//TODO copy to the master
var util = require('./utilityLib');
//const mongoURI = util.mongoUrl()
const mongoURILib = util.mongoUrlLibInit(); //mongodb://localhost:27017/dservice

const connectToDatabase = () => {
	//console.log("libInit.js | connectToDatabase");
	return mongoose.connect( mongoURILib, {
		useNewUrlParser : true, useUnifiedTopology : true
	} );
};

const Libraries = require( './models/permission/DymerLibraries' );

const initLibraries = async () => {
	//console.log("libInit.js | initLibraries");
	try {
		//Stats
		const totStartLibs = await Libraries.countDocuments();

		let insertedCount = 0;
		let ignoredCount = 0;

		for ( const library of dataToInsert ) {
			const existingLibrary = await Libraries.findOne( {
				name      : library.name,
				domtype   : library.domtype,
				filename  : library.filename,
				callback  : library.callback,
				useonload : library.useonload,
				group     : library.group,
				activated : library.activated,
				loadtype  : library.loadtype
			} );

			if ( !existingLibrary ) {
				const newLibrary = new Libraries( library );
				await newLibrary.save();
				insertedCount++;
			} else {
				ignoredCount++;
			}
		}

		const totEndLibs = await Libraries.countDocuments();

		console.log( 'Library Summary:' );
		console.log( 'Total libraries in the database before insertion: ', totStartLibs );
		console.log( 'Libraries inserted: ', insertedCount );
		console.log( 'Libraries ignored: ', ignoredCount );
		console.log( 'Total libraries in the database after insertion: ', totEndLibs );

	} catch ( error ) {
		console.error( "Error during the insertion of libraries into the database:", error );
	}
};

connectToDatabase().then( () => {
	//console.log("libInit.js | connectToDatabase && initLibraries");
	const db = mongoose.connection;
	db.on( 'error', console.error.bind( console, 'Database connection error:' ) );
	console.log( 'Connected to MongoDB database successfully.' );
	initLibraries().then( () => {
		console.log( "initLibraries completed." );
	} )
		.catch( error => {
			console.error( "Error during initLibraries:", error );
		} );
} )
	.catch( error => {
		console.error( "Error during the connection to the database:", error );
	} );

module.exports = {
	connectToDatabase
}
