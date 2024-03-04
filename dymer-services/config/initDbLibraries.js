const dataToInsert = require( './initDbLibraries.json' );
const initLibraries = async ( Libraries ) => {
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
				// console.log( `Libreria '${ library.name }' aggiunta al database.` );
				insertedCount++;
			} else {
				// console.log( `Libreria '${ library.name }' già presente nel database. Ignorata.` );
				ignoredCount++;
			}
		}

		const totEndLibs = await Libraries.countDocuments();

		console.log( 'Library Summary:' );
		console.log( 'Total libraries in the database before insertion:', totStartLibs );
		console.log( 'Libraries inserted:', insertedCount );
		console.log( 'Libraries ignored', ignoredCount );
		console.log( 'Total libraries in the database after insertion:', totEndLibs );

	} catch ( error ) {
		console.error( "Errore durante l'inserimento delle librerie nel database:", error );
	}
};

module.exports = initLibraries;