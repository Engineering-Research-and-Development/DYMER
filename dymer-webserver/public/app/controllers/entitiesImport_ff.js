angular.module('entitiesImportControllers', [])
    .controller('entitiesImport_ff', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        //   console.log('testing controller entitiesImport_ff');
        $scope.method = "GET";
        $scope.host = "http://localhost";
        $scope.port = "8008";
        $scope.path = "/";
        var mapping = {
            "ID": "__id",
            "TYPE": "__type",
            "_index": "_index",
            "_source": "_source"
        };
        $scope.mapping = JSON.stringify(mapping, '",', '\t');


		   $http.get( baseContextPath + '/api/entities/api/v1/entity/allstatsglobal', {} ).then( function ( retE ) {
			   let res = retE.data.data.indices;
			   $scope.listEntities = res.map( ( e ) => e.index )
			   // $scope.listEntities.shift()
			   let entRelIndex = $scope.listEntities.indexOf( "entity_relation" )
			   if ( entRelIndex !== -1 ) {
				   $scope.listEntities.splice( entRelIndex, 1 )
			   }
		   } ).catch( function ( e ) {
			   console.error( "error: ", e )
		   } )


		   $scope.importEntFl = function () {

			   var pathService = $scope.host + ':' + $scope.port + $scope.path
			   if ( $scope.method == 'GET' ) {
				   $http.get( pathService,
							  $scope.mapping
				   ).then( function ( ret ) {
					   console.log( 'Import Resp', ret );

                    return $scope.import_result = ret;
                }).catch(function(response) {
                    console.log(response.status);
                });

            }
            if ($scope.method == 'POST') {
                $http.post(pathService, $scope.mapping).then(function(ret) {
                    console.log('Import Resp', ret);

					   $scope.import_result = ret;
				   } ).catch( function ( response ) {
					   console.log( response.status );
				   } );
			   }
		   }

		   $scope.ExportJSON = function () {
			   console.log( "Exporting JSON" )
			   exportEntities.exportJSONFormat( baseContextPath, { index : $scope.selectedEntity } )
		   }
		   $scope.selectedOptions = [];

		   $scope.ExportCSV = function () {
			   console.log( "Exporting CSV" )
			   let options = $scope.FieldsForIndex
			   //let selectedOptions = $scope.selectedOptions || [];

			   let selectedOptions = [];
			   for ( let option in $scope.selectedOptions ) {
				   if ( $scope.selectedOptions.hasOwnProperty( option ) && $scope.selectedOptions[ option ] ) {
					   selectedOptions.push( option );
				   }
			   }


			   console.log( "SELECTED", selectedOptions )

			   let excluededFields = options.filter( element => !selectedOptions.includes( element ) )
			   exportEntities.exportCSVFormat( baseContextPath,
											   { index : $scope.selectedEntity, exclude : excluededFields }
			   )
		   }

		   $scope.selectOptions = function () {
			   let index = $scope.selectedEntity
			   //   let fields = []

			   $http.get( baseContextPath + '/api/entities/api/v1/entity/getstructure/' + index )
					.then( function ( rt ) {
						$scope.FieldsForIndex = rt.data// fields

					} ).catch( function ( e ) {
				   console.log( "Error: ", e )
			   } )
		   }

		   $scope.importJSONFile = async function () {

			   var myFile = $scope.myFile
			   let url = baseContextPath + '/api/dservice/api/v1/import/test' //baseContextPath +
																			  // "/api/entities/api/v1/entity/test"

			   let data = {
				   file : myFile
			   }

			   let upload = await multipartForm.post( url, data )

			   let index = upload.data
			   $scope.selecetdIndex = Object.keys( resp.data.data[ index ].mappings[ index ].properties )
			   console.log( "keys: ", $scope.selecetdIndex )
		   }


		   $scope.importCSVFile = async function () {
			   let separator = $scope.separator ? $scope.separator : ","
			   let model = $scope.selectedIndex
			   let enableRel = $scope.entityToRelation?.checked ? $scope.entityToRelation.checked : false
			   let relto = enableRel ? $scope.entityToRelation.index : ""

			   let checkedFields = $scope.originalFields.concat( $scope.newCustomStaticRows )
										 .filter( element => element.checked === true )

			   checkedFields.forEach( ( el ) => {
				   if ( el.newName === "placeholder" || el.newName === "" || el.newName === undefined ) {
					   el.newName = el.originalName
				   }
			   } )

			   console.log( "checkedFields: ", checkedFields )

			   let csvRecords = $scope.csvRecords.data
			   console.log( "# REC ", csvRecords.length )
			   let dataToImport = []

			   let fieldNames = csvRecords[ 0 ].replace( /["]/g, "" ).split( separator ) //header

			   for ( let _record of csvRecords ) {   // for each "line" of the csv
				   let recArray = _record.replace( /["]/g, "" ).split( separator ) // get values-array

				   let obj = {}
				   for ( let element of checkedFields ) {

					   let index = fieldNames.indexOf( element.originalName )
					   let key = element.newName

					   obj[ key ] = recArray[ index ]
				   }

				   if ( model == "service" ) {
					   let dih_index = fieldNames.indexOf( "DIH" )
					   obj[ "DIH" ] = recArray[ dih_index ]
				   }

				   dataToImport.push( obj ) //
			   }
			   dataToImport.shift()

			   console.log( "dataToImport: ", dataToImport )
			   console.log( "index:", $scope.selectedIndex )

			   console.log( "RELATION TO: ", $scope.entityToRelation )

			   let url = baseContextPath + "/api/dservice/api/v1/import/fromcsv/" + model
			   $http.post( url, { dataToImport, indtorel : relto } ).then( function ( ret ) {
				   console.log( 'Import Resp', ret );
				   useGritterTool( "Import from CSV started", ret.status );

			   } ).catch( function ( response ) {
				   console.log( response.status );
			   } );
		   }

		   $scope.getFieldByCSV = async function () {
			   var myFile = $scope.myFile
			   let separator = $scope.separator ? $scope.separator : ","
			   console.log( "baseContextPath: ", baseContextPath )
			   let url = baseContextPath + '/api/dservice/api/v1/import/test-csv' //baseContextPath +
																				  // "/api/entities/api/v1/entity/test"

			   let data = {
				   file : myFile
			   }

			   $scope.csvRecords = await multipartForm.post( url, data )
			   let fieldNames = $scope.csvRecords.data[ 0 ].split( separator )

			   if ( fieldNames ) {
				   $scope.loadedCSV = true;
			   }

			   $scope.originalFields = $scope.indexFields.map(
				   el => { return { newName : el, checked : false, index : $scope.indexFields.indexOf( el ) } } )

			   $scope.csvFields = fieldNames


			   $scope.newCustomStaticRows = []

			   for ( let i = 0 ; i < 5 ; i++ ) {
				   $scope.newCustomStaticRows.push(
					   { newName : "", checked : false, index : ( $scope.originalFields.length + i ) } )
			   }

			   console.log( "originalFields ", $scope.originalFields )
		   }

		   $scope.getIndexStructure = async function () {

			   let index = $scope.selectedIndex
			   let url = baseContextPath + '/api/entities/api/v1/entity/allindex/' + index
			   let JSONStructureResponse = await $http.get( url )
			   let JSONStructure = JSONStructureResponse.data.data[ index ].mappings[ index ].properties

			   let structure = []
			   for ( const key in JSONStructure ) {
				   if ( JSONStructure[ key ].hasOwnProperty( "properties" ) ) {
					   for ( const subKey in JSONStructure[ key ][ "properties" ] ) {
						   structure.push( `${ key }.${ subKey }` );
					   }
				   } else {
					   structure.push( key );
				   }
			   }
			   $scope.indexFields = structure
		   }

		   $scope.resetFields = function () {
			   $scope.indexFields = []
			   $scope.csvRecords = ""
			   $scope.selectedIndex = ""
			   $scope.separator = ""
			   $scope.originalFields = ""
			   $scope.csvRecords = ""
			   $scope.entityToRelation = ""
			   $scope.csvFields = ""
			   $scope.loadedCSV = false
			   $scope.myFile = null

			   document.getElementById( "uploadBox" ).value = "";
		   }

	   } );