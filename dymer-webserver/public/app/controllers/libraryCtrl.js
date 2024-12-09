angular.module('libraryCtrl', [])
	.controller('libraryController', function ($scope, $http, $rootScope, multipartForm) {
		const contextPath = $rootScope.globals.contextpath;
		const libsURL = `${contextPath}/api/dservice/api/v1/library/`;

		//All Available Cards
		const cardTypes = ['view', 'map', 'form'];

		$scope.libraryCardsConfigs = cardTypes.map(cardType => generateCardsConfig(cardType));

		function generateCardsConfig(cardType) {
			const title = cardType.charAt(0).toUpperCase() + cardType.slice(1);
			const tableId = `${cardType}LibrariesTable`;
			const tableBodyId = `${tableId}Body`;

			return {
				title: `${title} Libraries`,
				showConfig: false,
				tableId: tableId,
				tableBodyId: tableBodyId,
				columns: ['Name', 'Filename', 'Callback', 'Use Onload', 'Group', 'Mandatory']
				//columns: ['Name','Domtype','Filename','Callback','Use Onload','Group','Load Type','Mandatory']
			};
		}

		$scope.libraries = [];

		// Get data and Generate Tables
		$http.get(libsURL)
			.then(response => {
				// console.log( 'Server response: ', response.data );
				$scope.libraries = response.data;

				generateLibrariesTablesBody($scope.libraries);
			})
			.catch(error => {
				console.error('Errore nel recupero delle librerie:', error);
			});

		// Generate library tables body
		function generateLibrariesTablesBody(libraries) {
			cardTypes.forEach(cardType => {
				const tableBody = document.getElementById(`${cardType}LibrariesTableBody`);
				generateRows(libraries.filter(({ loadtype }) => loadtype === cardType), tableBody);
			});
		}

		function generateRows(libraries, tableBody) {
			libraries.forEach(library => {
				const row = createRow(library);
				tableBody.appendChild(row);
			});
		}

		function createRow(library) {
			const row = document.createElement('tr');
			const headerFieldNames = getHeaderFieldNames(library);

			headerFieldNames.forEach(fieldName => {
				const cell = createCell(fieldName, library);
				row.appendChild(cell);
			});

			const toggleSwitchCell = createToggleSwitchCell(library);
			row.appendChild(toggleSwitchCell);

			const actionCell = createActionCell(library);
			row.appendChild(actionCell);

			return row;
		}

		function getHeaderFieldNames(library) {
			return Object.keys(library).filter(
				fieldName => !['_id', 'domtype', 'activated', 'loadtype'].includes(fieldName));
		}

		function createCell(fieldName, library) {
			const cell = document.createElement('td');
			const label = document.createElement('span');
			label.className = 'ng-binding';

			switch (fieldName) {
				case 'filename':
					const nameOfFile = library.filename.split('/').pop();
					label.textContent = nameOfFile;
					cell.style.textAlign = 'center';
					cell.appendChild(label);
					cell.addEventListener('mouseover', () => showPopup(library.filename, cell));
					cell.addEventListener('mouseout', hidePopup);
					break;

				case 'callback':
					label.textContent = library.callback !== null ? 'Show Callback' : library[fieldName];
					label.addEventListener('mouseover', () => showPopup(library.callback, cell));
					label.addEventListener('mouseout', hidePopup);
					cell.style.textAlign = 'center';
					cell.appendChild(label);
					break;

				case 'useonload':
				case 'mandatory':
					// label.style.color = library[ fieldName ] ? 'green' : 'red';
					const i = document.createElement('i');
					i.className = library[fieldName] ? 'fa fa-check' : 'fa fa-times'
					label.appendChild(i);
					cell.style.textAlign = 'center';
					cell.appendChild(label);
					break;

				default:
					label.textContent = library[fieldName];
					cell.style.textAlign = 'center';
					cell.appendChild(label);
			}

			return cell;
		}

		function showPopup(content, anchorElement) {
			const popup = document.createElement('div');
			popup.className = 'popup';

			const preElement = document.createElement('pre');
			preElement.className = 'language-javascript';
			const codeElement = document.createElement('code');
			codeElement.className = 'language-javascript';
			codeElement.textContent = content;
			preElement.appendChild(codeElement);

			popup.appendChild(preElement);

			const rect = anchorElement.getBoundingClientRect();

			const anchorWidth = anchorElement.offsetWidth;
			const popupWidth = popup.offsetWidth;
			const leftPosition = rect.left + (anchorWidth - popupWidth) / 2;

			popup.style.position = 'absolute';
			popup.style.top = rect.bottom + 'px';
			popup.style.left = leftPosition + 'px';

			document.body.appendChild(popup);

			Prism.highlightAllUnder(popup);
		}

		function hidePopup() {
			const popup = document.querySelector('.popup');
			if (popup) {
				document.body.removeChild(popup);
			}
		}

		function createToggleSwitchCell(library) {
			const toggleSwitchCell = document.createElement('td');
			toggleSwitchCell.style.textAlign = 'center';

			if (!library.mandatory) {
				const toggleSwitch = document.createElement('div');
				toggleSwitch.className = 'library-toggle-switch';

				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.checked = library.activated;
				checkbox.id = 'myCheckbox' + library._id; // Assuming library._id exists
				checkbox.addEventListener('change', () => $scope.checkboxChanged(library));
				toggleSwitch.appendChild(checkbox);

				const toggleSlider = document.createElement('label');
				toggleSlider.setAttribute('for', 'myCheckbox' + library._id); // Assuming library._id exists
				toggleSlider.className = 'library-toggle-slider';
				toggleSwitch.appendChild(toggleSlider);

				toggleSwitchCell.appendChild(toggleSwitch);
			}


			return toggleSwitchCell;
		}

		// Manage state of checkbox
		$scope.checkboxChanged = library => {
			// console.log( `${ library.name } [${ library._id }] changed state in ${ library.activated }` );

			// Update state in backend
			const requestBody = { activated: !library.activated };

			$http.patch(`${libsURL}${library._id}`, requestBody)
				.then(response => {
					// Update 'activated' in library Object
					library.activated = !library.activated;
					let flag = library.activated ? 'activated' : 'deactivated';
					console.log(`Now ${library.name} has been ${flag}: ${JSON.stringify(response.data)}`);
					useGritterTool("<b><i class='fa fa-refresh'></i> Reload page to see changes</b>",
						`Now ${library.name} has been ${flag},
										Reload page to see changes`
					);
				})
				.catch(error => {
					console.error("Error updating status in backend:", error);
					useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Error updating status</b>",
						error.data.error,
						"danger"
					);
				});
		};

		function createActionCell(library) {
			const actionCell = document.createElement('td');
			actionCell.className = 'text-center';
			actionCell.style.width = '50px';

			let deleteButton;

			if (!(library.mandatory)) {
				// Pulsante di delete
				deleteButton = createIconButton('fa fa-trash deleteAction',
					() => $scope.removeLibrary(library)
				);
			} else {
				const icon = document.createElement('i');
				icon.className = 'fa fa-ban deleteAction';
				icon.setAttribute('aria-hidden', 'true');
				deleteButton = icon;

			}
			actionCell.appendChild(deleteButton);

			/* // Pulsante di update
			const updateButton = createIconButton( 'fa fa-pencil updateAction',
												   () => $scope.setupdateLibrary( library )
			);
			actionCell.appendChild( updateButton ); */

			return actionCell;
		}

		$scope.removeLibrary = library => {
			const libraryId = library._id;

			/*MG - Eliminazione solo logica (da Mongo) e non anche fisica (da File System) - Inizio*/
			/*  
			$http.delete( `${ contextPath }/public/filelibrary/${ libraryId }` )
				 .then( response => {
					 console.log(`Library [${ library.name }] has been deleted from disk!`)
				 } ).then( () => {
				$http.delete( `${ libsURL }${ libraryId }` )
					 .then( response => {
						 console.log( `Library deleted successfully: ${ response.data.message }` );
						 useGritterTool( "<b><i class='fa fa-refresh'></i> Reload page to see changes</b>",
										 `Library deleted successfully: ${ response.data.message }
									 Reload page to see changes`
						 );
					 } ).catch( error => {
					console.error( 'Error while deleting library:', error );
					useGritterTool( "<b><i class='fa fa-exclamation-triangle'></i> Error deleting library</b>",
									error.data.error,
									"danger"
					);
				} );
			} );
			*/
			$http.delete(`${libsURL}${libraryId}`).then(response => {
				console.log(`Library deleted successfully: ${response.data.message}`);
				useGritterTool("<b><i class='fa fa-refresh'></i> Reload page to see changes</b>",
					`Library deleted successfully: ${response.data.message}
								   Reload page to see changes`
				);
			}).catch(error => {
				console.error('Error while deleting library:', error);
				useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Error deleting library</b>",
					error.data.error,
					"danger"
				);
			});
			/*MG - Eliminazione solo logica (da Mongo) e non anche fisica (da File System) - Fine*/
		}

		/* $scope.setupdateLibrary = library => {
			const libraryId = library._id;
			const requestBody = {
				// TODO fields to update
			};

			$http.put( `${ libsURL }${ libraryId }`, requestBody )
				 .then( response => {
					 console.log( `Library updated successfully: ${ response.data.message }` );
					 // Aggiungi qui eventuali azioni da eseguire dopo l'aggiornamento
				 } )
				 .catch( error => {
					 console.error( 'Error while updating library:', error );
					 // Gestisci l'errore come preferisci
				 } );
		}; */

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
			if (/^\s*$/.test($scope.library.callback)) {
				$scope.library.callback = null;
			}

			let data = { file: $scope.fileUpload, path: $scope.library.filename }
			multipartForm.post(`${contextPath}/public/filelibrary`, data)
				.then(response => {
					$scope.library.filename += `/${response.data.data}`
					// Log the response
					console.log('File uploaded successfully:', response);
				}).then(() => {
					// $scope.library.filename +=  `/${ response.data } `
					$http.post(libsURL, $scope.library)
						.then(response => {
							console.log(`New library added successfully: ${JSON.stringify(response.data.data)}`);
							useGritterTool("<b><i class='fa fa-refresh'></i> Reload page to see changes</b>",
								`New library ${response.data.data.name} added successfully, Reload page to see changes`
							);
						})
						.catch(error => {
							console.error('Error while created library. Try Again!:', error);
							useGritterTool(
								"<b><i class='fa fa-exclamation-triangle'></i> 'Error creating new library</b>",
								error.data.error,
								"danger"
							);
						});
				}
				)
				.catch(error => {
					console.error('Error while created library. Try Again!:', error);
				});
		};

		$scope.cancelAddLibrary = () => {
			$scope.library = {
				name: '',
				domtype: '',
				filename: '',
				callback: null,
				useonload: null,
				group: '',
				loadtype: '',
				mandatory: false
			};
		};

		$scope.showLibraryForm = () => {
			if ($scope.selectedLibraryType === 'Javascript') {
				setLibraryValues('-js', 'script', true, "js");
			} else if ($scope.selectedLibraryType === 'CSS') {
				setLibraryValues('-css', 'link', false, "css");
			}
		};

		function setLibraryValues(suffix, domType, useOnLoad, folder) {
			appendSuffixIfNeeded($scope.library, suffix);
			$scope.library.domtype = domType;
			$scope.library.useonload = useOnLoad;
			$scope.library.filename = `${folder}/lib/${$scope.library.name}`;
		}

		function appendSuffixIfNeeded(library, suffix) {
			const suffixes = ["-js", "-css"];

			// Check if the library name already ends with one of the suffixes
			const currentSuffix = suffixes.find(s => library.name.endsWith(s));

			// If the library name ends with one of the suffixes, removes it
			if (currentSuffix) {
				library.name = library.name.slice(0, -currentSuffix.length);
			}

			// Adds the new suffix if it is not already present in the library name
			if (!library.name.endsWith(suffix)) {
				library.name += suffix;
			}
		}

		// AC - ReloadLibraries feature - START
		$scope.openModal = function () {
			$('#confirmationModal').modal('show');
		};

		$scope.confirmReload = function () {
			$('#confirmationModal').modal('hide');
			$scope.reloadLibraries();
		};

		$scope.DismissReload = function () {
			$('#confirmationModal').modal('hide');
		};


		$scope.reloadLibraries = function () {
			/* Eliminazione solo logica (da Mongo) e non anche fisica (da File System) */
			console.log("Libraries reloading...!");
			
			$http.post(`${libsURL}/reload`).then(response => {
				console.log(`Libraries reloaded successfully: ${response.data.message}`);
				useGritterTool("<b><i class='fa fa-refresh'></i> Libraries ReloadeD</b>",
					`Library reloaded successfully: ${response.data.message}
								   Reload page to see changes`
				);
			}).catch(error => {
				console.error('Error while reloading library:', error);
				useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Error reloading library</b>",
					error.data.error,
					"danger"
				);
			});
		};
		// AC - ReloadLibraries feature - END
	});
