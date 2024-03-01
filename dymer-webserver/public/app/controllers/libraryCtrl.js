angular.module( 'libraryCtrl', [] )
	   .controller( 'libraryController', function ( $scope, $http, $rootScope ) {
		   const contextPath = $rootScope.globals.contextpath;
		   const libsURL = contextPath + '/api/dservice/api/v1/library/';
		   $scope.libraries = [];

		   const materialDesignToggleSwitchCSS = `
				.toggle-switch {
					position: relative;
					display: inline-block;
					width: 60px;
					height: 35px;
				}
			
				.toggle-switch input {
					display: none;
				}
			
				.toggle-slider {
					position: absolute;
					cursor: pointer;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background-color: #9e9e9e;
					transition: 0.4s;
					border-radius: 5px;
					display: block;
				}
			
				.toggle-slider:before {
					content: "";
					position: absolute;
					height: 26px;
					width: 26px;
					left: 4px;
					bottom: 4px;
					background-color: white;
					transition: 0.4s;
					border-radius: 5px;
					top: 2px;
					display: block;
				}
			
				.toggle-switch input:checked + .toggle-slider {
					background-color: #51cbce;
				}
			
				.toggle-switch input:checked + .toggle-slider:before {
					transform: translateX(26px);
				}
			`;


		   // Funzione per gestire il cambio di stato della checkbox
		   $scope.checkboxChanged = library => {
			   // console.log( `${ library.name } [${ library._id }] changed state in ${ library.activated }` );

			   let requestBody = { activated : !library.activated };

			   $http.patch( libsURL + library._id, requestBody )
					.then( function ( response ) {
						// Aggiorna la proprietà activated dell'oggetto library
						library.activated = !library.activated;
						// console.log( 'Stato aggiornato nel backend con successo:', response.data );
					} )
					.catch( function ( error ) {
						console.error( "Errore nell'aggiornamento dello stato nel backend:", error );
					} );
		   };

		   // Ottieni data e genera la tabella
		   $http.get( libsURL )
				.then( response => {
					// console.log( 'Risposta dal server: ', response.data );
					$scope.libraries = response.data;

					// genera le righe della tabella parametricamente
					generateLibraryRows( $scope.libraries );

					// Aggiungi lo stile CSS al tag <style> nell'intestazione del documento
					const styleTag = document.createElement( 'style' );
					styleTag.innerHTML = materialDesignToggleSwitchCSS;
					document.head.appendChild( styleTag );
				} )
				.catch( error => {
					console.error( 'Errore nel recupero delle librerie:', error );
				} );

		   function generateLibraryRows( libraries ) {
			   const viewTableBody = document.getElementById( 'viewLibrariesTableBody' );

			   generateRows( libraries.filter( ( { loadtype } ) => loadtype === 'view' ), viewTableBody );

			   $scope.showViewConfig = true;

		   }

		   // Funzione per generare le righe della tabella
		   function generateRows( libraries, tableBody ) {
			   libraries.forEach( library => {
				   const row = tableBody.insertRow();

				   // Lista dei nomi dei campi esclusi "activated" e "_id"
				   const headerFieldNames = Object.keys( libraries[ 0 ] ).filter(
					   fieldName => fieldName !== 'activated' && fieldName !== '_id' );

				   headerFieldNames.forEach( ( fieldName, index ) => {
					   const cell = row.insertCell( index );

					   // Popola la cella con il valore del campo
					   const label = document.createElement( 'span' );
					   label.className = 'ng-binding';
					   label.textContent = library[ fieldName ];

					   // Aggiungi stile direttamente alla cella
					   cell.setAttribute( 'style', 'text-align: center;' );
					   cell.appendChild( label );
				   } );

				   // Aggiungi una cella per il toggle switch
				   const toggleSwitchCell = row.insertCell( headerFieldNames.length );
				   const toggleSwitch = document.createElement( 'div' );
				   toggleSwitch.className = 'toggle-switch';

				   const checkbox = document.createElement( 'input' );
				   checkbox.type = 'checkbox';
				   checkbox.id = 'myCheckbox' + row.rowIndex; // Utilizza un id univoco per ogni toggle switch
				   toggleSwitch.appendChild( checkbox );

				   const toggleSlider = document.createElement( 'label' );
				   toggleSlider.setAttribute( 'for', 'myCheckbox' + row.rowIndex );
				   toggleSlider.className = 'toggle-slider';
				   toggleSwitch.appendChild( toggleSlider );

				   checkbox.checked = library.activated;
				   checkbox.addEventListener( 'change', () => $scope.checkboxChanged( library ) );

				   // Aggiungi stile direttamente alla cella
				   toggleSwitchCell.setAttribute( 'style', 'text-align: center;' );
				   toggleSwitchCell.appendChild( toggleSwitch );
			   } );
		   }
	   } );
