angular.module( 'libraryCtrl', [] )
	   .controller( 'libraryController', function ( $scope, $http, $rootScope ) {
		   const contextPath = $rootScope.globals.contextpath;
		   const libsURL = `${ contextPath }/api/dservice/api/v1/library/`;

		   //All Available Cards
		   const cardTypes = [ 'view', 'map', 'form' ];

		   $scope.libraryCardsConfigs = cardTypes.map( cardType => generateCardsConfig( cardType ) );

		   function generateCardsConfig( cardType ) {
			   const title = cardType.charAt( 0 ).toUpperCase() + cardType.slice( 1 );
			   const tableId = `${ cardType }LibrariesTable`;
			   const tableBodyId = `${ tableId }Body`;

			   return {
				   title       : `${ title } Libraries`,
				   showConfig  : false,
				   tableId     : tableId,
				   tableBodyId : tableBodyId,
				   columns     : [ 'Name', 'Filename', 'Callback', 'Use Onload', 'Group', 'Mandatory' ]
				   //columns: ['Name','Domtype','Filename','Callback','Use Onload','Group','Load Type','Mandatory']
			   };
		   }

		   $scope.libraries = [];

		   // Get data and Generate Tables
		   $http.get( libsURL )
				.then( response => {
					// console.log( 'Server response: ', response.data );
					$scope.libraries = response.data;

					generateLibrariesTablesBody( $scope.libraries );
				} )
				.catch( error => {
					console.error( 'Errore nel recupero delle librerie:', error );
				} );

		   // Generate library tables body
		   function generateLibrariesTablesBody( libraries ) {
			   cardTypes.forEach( cardType => {
				   const tableBody = document.getElementById( `${ cardType }LibrariesTableBody` );
				   generateRows( libraries.filter( ( { loadtype } ) => loadtype === cardType ), tableBody );
			   } );
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

			   const actionCell = createActionCell(library);
			   row.appendChild(actionCell);

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
					   label.style.color = library[ fieldName ] ? 'green' : 'red';
					   const i = document.createElement( 'i' );
					   i.className = library[ fieldName ] ? 'fa fa-check' : 'fa fa-times'
					   label.appendChild( i );
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

		   // Manage state of checkbox
		   $scope.checkboxChanged = library => {
			   // console.log( `${ library.name } [${ library._id }] changed state in ${ library.activated }` );

			   // Update state in backend
			   const requestBody = { activated : !library.activated };

			   $http.patch( `${ libsURL }${ library._id }`, requestBody )
					.then( response => {
						// Update 'activated' in library Object
						library.activated = !library.activated;
						console.log( `Now ${ library.name } has 'actived': ${ response.data }` );
					} )
					.catch( error => {
						console.error( "Errore nell'aggiornamento dello stato nel backend:", error );
					} );
		   };

		   function createActionCell(library) {
			   const actionCell = document.createElement('td');
			   actionCell.className = 'text-center';
			   actionCell.style.width = '50px';

			   // Pulsante di update


			   // Pulsante di delete
			   const deleteButton = createIconButton('fa fa-trash deleteAction', () => $scope.removeLibrary(library));
			   actionCell.appendChild(deleteButton);

			   return actionCell;
		   }



		   $scope.removeLibrary = library => {
			   const libraryId = library._id;

			   $http.delete(`${libsURL}${libraryId}`)
					.then(response => {
						console.log(`Library deleted successfully: ${response.data.message}`);
						// Aggiungi qui eventuali azioni da eseguire dopo la rimozione
					})
					.catch(error => {
						console.error('Error while deleting library:', error);
						// Gestisci l'errore come preferisci
					});
		   };

		   function createIconButton(iconClass, clickHandler) {
			   const icon = document.createElement('i');
			   icon.className = iconClass;
			   icon.setAttribute('aria-hidden', 'true');
			   icon.addEventListener('click', clickHandler);

			   return icon;
		   }

		   $rootScope.showNewLibrary = false
		   $scope.selectedLibraryType = '';

		   $scope.library = {};

		   $scope.addLibrary = () => {
			   if ( /^\s*$/.test( $scope.library.callback ) ) {
				   $scope.library.callback = null;
			   }
			   $http.post( libsURL, $scope.library )
					.then( response => {
						console.log( `New librery added successfully: ${ response.data }` );
						useGritterTool( "<b><i class='nc-icon nc-single-02'></i>Dymer User</b>",
										"New librery added successfully"
						);
					} )
					.catch( error => {
						console.error( 'Errore while created library. Try Again!:', error );
						useGritterTool( "<b><i class='fa fa-exclamation-triangle'></i>Dymer User</b>", error.data.error,
										"danger"
						);
					} );
		   };

		   $scope.cancelAddLibrary = () => {
			   $scope.library = {
				   name      : '',
				   domtype   : '',
				   filename  : '',
				   callback  : null,
				   useonload : null,
				   group     : '',
				   loadtype  : '',
				   mandatory : false
			   };
		   };

		   $scope.showLibraryForm = () => {
			   if ( $scope.selectedLibraryType === 'Javascript' ) {
				   setLibraryValues( '-js', 'script', true );
			   } else if ( $scope.selectedLibraryType === 'CSS' ) {
				   setLibraryValues( '-css', 'link', false );
			   }
		   };

		   function setLibraryValues( suffix, domType, useOnLoad ) {
			   appendSuffixIfNeeded( $scope.library, suffix );
			   $scope.library.domtype = domType;
			   $scope.library.useonload = useOnLoad;
		   }

		   function appendSuffixIfNeeded( library, suffix ) {
			   const suffixes = [ "-js", "-css" ];

			   // Check if the library name already ends with one of the suffixes
			   const currentSuffix = suffixes.find( s => library.name.endsWith( s ) );

			   // If the library name ends with one of the suffixes, removes it
			   if ( currentSuffix ) {
				   library.name = library.name.slice( 0, -currentSuffix.length );
			   }

			   // Adds the new suffix if it is not already present in the library name
			   if ( !library.name.endsWith( suffix ) ) {
				   library.name += suffix;
			   }
		   }
	   } );
