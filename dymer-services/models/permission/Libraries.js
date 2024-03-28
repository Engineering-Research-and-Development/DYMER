const mongoose = require( "mongoose" );

const librarySchema = new mongoose.Schema( {
											   name      : {
												   type     : String,
												   required : true
											   },
											   domtype   : {
												   type     : String,
												   required : true
											   },
											   filename  : {
												   type     : String,
												   required : true
											   },
											   callback  : {
												   type    : String,
												   default : null
											   },
											   useonload : {
												   type     : Boolean,
												   required : true
											   },
											   group     : {
												   type     : String,
												   required : true
											   },
											   activated : {
												   type    : Boolean,
												   default : true
											   },
											   loadtype  : {
												   type     : String,
												   required : true
											   },
											   mandatory : {
												   type    : Boolean,
												   default : false
											   }
										   }, { versionKey : false } );

const Libraries = mongoose.model( "Libraries", librarySchema );

module.exports = Libraries;