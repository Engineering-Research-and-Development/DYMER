angular.module( 'libraryCtrl', [] )
	   .controller( 'libraryController', function ( $scope, $http, $rootScope ) {
		   const contextPath = $rootScope.globals.contextpath;
		   const libsURL = contextPath + '/api/dservice/api/v1/library/';

		   $scope.libraryCardsConfigs = [ generateCardsConfig( 'View Libraries', false, 'viewLibrariesTable', 'viewLibrariesTableBody' ),
										  generateCardsConfig( 'Map Libraries', false, 'mapLibrariesTable', 'mapLibrariesTableBody' ),
										  generateCardsConfig( 'Form Libraries', false, 'formLibrariesTable', 'formLibrariesTableBody' )
		   								]


		   //all columns: [ 'Name', 'Domtype', 'Filename', 'Callback', 'Use Onload', 'Group', 'Load Type', 'Mandatory' ]
		   function generateCardsConfig( title, showConfig, tableId, tableBodyId ) {
			   return {
				   title       : title,
				   showConfig  : showConfig,
				   tableId     : tableId,
				   tableBodyId : tableBodyId,
				   columns     : [ 'Name', 'Filename', 'Callback', 'Use Onload', 'Group', 'Mandatory' ]
			   };
		   }

		   $scope.libraries = [];

		   // Manage state of checkbox
		   $scope.checkboxChanged = library => {
			   // console.log( `${ library.name } [${ library._id }] changed state in ${ library.activated }` );

			   // Update state in backend
			   let requestBody = { activated : !library.activated };

			   $http.patch( libsURL + library._id, requestBody )
					.then( response => {
						// Update 'activated' in library Object
						library.activated = !library.activated;
						console.log( `Now ${ library.name } has 'actived': ${ response.data }` );
					} )
					.catch( error => {
						console.error( "Errore nell'aggiornamento dello stato nel backend:", error );
					} );
		   };

		   // Get data and Generate Tables
		   $http.get( libsURL )
				.then( response => {
					// console.log( 'Risposta dal server: ', response.data );
					$scope.libraries = response.data;

					generateLibrariesTablesBody( $scope.libraries );
				} )
				.catch( error => {
					console.error( 'Errore nel recupero delle librerie:', error );
				} );

		   function generateLibrariesTablesBody( libraries ) {
			   const viewTableBody = document.getElementById( 'viewLibrariesTableBody' );
			   const mapTableBody = document.getElementById( 'mapLibrariesTableBody' );
			   const formTableBody = document.getElementById( 'formLibrariesTableBody' );

			   generateRows( libraries.filter( ( { loadtype } ) => loadtype === 'view' ), viewTableBody );
			   generateRows( libraries.filter( ( { loadtype } ) => loadtype === 'map' ), mapTableBody );
			   generateRows( libraries.filter( ( { loadtype } ) => loadtype === 'form' ), formTableBody );
		   }

		   function generateRows( libraries, tableBody ) {
			   libraries.forEach( library => {
				   const row = createRow( library );
				   tableBody.appendChild( row );
			   } );
		   }

		   function createRow( library ) {
			   const row = document.createElement( 'tr' );
			   const headerFieldNames = getHeaderFieldNames( library );

			   headerFieldNames.forEach( fieldName => {
				   const cell = createCell( fieldName, library );
				   row.appendChild( cell );
			   } );

			   const toggleSwitchCell = createToggleSwitchCell( library );
			   row.appendChild( toggleSwitchCell );

			   return row;
		   }

		   function getHeaderFieldNames( library ) {
			   return Object.keys( library ).filter(
				   fieldName => ![ '_id', 'domtype', 'activated', 'loadtype' ].includes( fieldName ) );
		   }

		   function createCell( fieldName, library ) {
			   const cell = document.createElement( 'td' );
			   const label = document.createElement( 'span' );
			   label.className = 'ng-binding';

			   switch ( fieldName ) {
				   case 'filename':
					   const nameOfFile = library.filename.split( '/' ).pop();
					   label.textContent = nameOfFile;
					   cell.style.textAlign = 'center';
					   cell.appendChild( label );
					   cell.addEventListener( 'mouseover', () => showPopup( library.filename, cell ) );
					   cell.addEventListener( 'mouseout', hidePopup );
					   break;

				   case 'callback':
					   label.textContent = library.callback !== null ? 'Show Callback' : library[ fieldName ];
					   label.addEventListener( 'mouseover', () => showPopup( library.callback, cell ) );
					   label.addEventListener( 'mouseout', hidePopup );
					   cell.style.textAlign = 'center';
					   cell.appendChild( label );
					   break;

				   case 'useonload':
				   case 'mandatory':
					   label.textContent = library[ fieldName ];
					   label.style.fontWeight = library[ fieldName ] ? 'bold' : 'normal';
					   label.style.fontStyle = library[ fieldName ] ? 'normal' : 'italic';
					   label.style.color = library[ fieldName ] ? 'green' : 'red';
					   cell.style.textAlign = 'center';
					   cell.appendChild( label );
					   break;

				   default:
					   label.textContent = library[ fieldName ];
					   cell.style.textAlign = 'center';
					   cell.appendChild( label );
			   }

			   return cell;
		   }

		   function createToggleSwitchCell( library ) {
			   const toggleSwitchCell = document.createElement( 'td' );
			   toggleSwitchCell.style.textAlign = 'center';

			   if ( !library.mandatory ) {
				   const toggleSwitch = document.createElement( 'div' );
				   toggleSwitch.className = 'library-toggle-switch';

				   const checkbox = document.createElement( 'input' );
				   checkbox.type = 'checkbox';
				   checkbox.checked = library.activated;
				   checkbox.id = 'myCheckbox' + library._id; // Assuming library._id exists
				   checkbox.addEventListener( 'change', () => $scope.checkboxChanged( library ) );
				   toggleSwitch.appendChild( checkbox );

				   const toggleSlider = document.createElement( 'label' );
				   toggleSlider.setAttribute( 'for', 'myCheckbox' + library._id ); // Assuming library._id exists
				   toggleSlider.className = 'library-toggle-slider';
				   toggleSwitch.appendChild( toggleSlider );

				   toggleSwitchCell.appendChild( toggleSwitch );
			   }


			   return toggleSwitchCell;
		   }

		   function showPopup( content, anchorElement ) {
			   const popup = document.createElement( 'div' );
			   popup.className = 'popup';

			   const preElement = document.createElement( 'pre' );
			   preElement.className = 'language-javascript';
			   const codeElement = document.createElement( 'code' );
			   codeElement.className = 'language-javascript';
			   codeElement.textContent = content;
			   preElement.appendChild( codeElement );

			   popup.appendChild( preElement );

			   const rect = anchorElement.getBoundingClientRect();

			   const anchorWidth = anchorElement.offsetWidth;
			   const popupWidth = popup.offsetWidth;
			   const leftPosition = rect.left + ( anchorWidth - popupWidth ) / 2;

			   popup.style.position = 'absolute';
			   popup.style.top = rect.bottom + 'px';
			   popup.style.left = leftPosition + 'px';

			   document.body.appendChild( popup );

			   Prism.highlightAllUnder( popup );
		   }

		   function hidePopup() {
			   const popup = document.querySelector( '.popup' );
			   if ( popup ) {
				   document.body.removeChild( popup );
			   }
		   }

		   $rootScope.showNewLibrary = false
		   $scope.selectedLibraryType = '';
		   $scope.newLibrary = {};

		   $scope.addLibrary = () => {
			   $http.post( libsURL, $scope.newLibrary )
					.then( response => {
						let success = 'New librery added successfully';
						console.log( `${ success }: ${ response.data }` );
						useGritterTool( "<b><i class='nc-icon nc-single-02'></i>Dymer User</b>", success );
					} )
					.catch( error => {
						console.log( error )
						console.error( 'Errore while created library. Try Again!:', error );
						useGritterTool( "<b><i class='fa fa-exclamation-triangle'></i>Dymer User</b>", error.data.error,
										"danger"
						);
					} );
		   };

		   $scope.cancelAddLibrary = () => {
			   $scope.newLibrary = {
				   name      : '',
				   domtype   : '',
				   filename  : '',
				   callback  : '',
				   useonload : null,
				   group     : '',
				   loadtype  : '',
				   mandatory : false
			   };
		   };

		   $scope.showLibraryForm = () => {
			   if ( $scope.selectedLibraryType === 'Javascript' ) {
				   appendSuffixIfNeeded( $scope.newLibrary, '-js' );
				   $scope.newLibrary.domtype = 'script';
				   $scope.newLibrary.useonload = true;
			   } else if ( $scope.selectedLibraryType === 'CSS' ) {
				   appendSuffixIfNeeded( $scope.newLibrary, '-css' );
				   $scope.newLibrary.domtype = 'link';
				   $scope.newLibrary.useonload = false;
			   }
		   };

		   function appendSuffixIfNeeded( library, suffix ) {
			   const suffixes = [ "-js", "-css" ];

			   // Check if the library name already ends with one of the suffixes
			   const endsWithOneOfSuffixes = suffixes.some( s => library.name.endsWith( s ) );

			   // If the library name ends with one of the suffixes, removes it
			   if ( endsWithOneOfSuffixes ) {
				   suffixes.forEach( s => {
					   if ( library.name.endsWith( s ) ) {
						   library.name = library.name.slice( 0, -s.length );
					   }
				   } );
			   }

			   // Adds the new suffix if it is not already present in the library name
			   if ( !library.name.endsWith( suffix ) ) {
				   library.name += suffix;
			   }
		   }
	   } );
