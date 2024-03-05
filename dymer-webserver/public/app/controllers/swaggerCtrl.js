angular.module( 'swaggerCtrl', [] )
	   .controller( 'swaggerController', function ( $scope, $http, $rootScope ) {
		   var baseContextPath = $rootScope.globals.contextpath;
		   let swaggerDocUrl;

		   $http.get( baseContextPath + "/swaggerdoc" ).then( response => {
			   swaggerDocUrl = response.data.swaggerDocUrl;
			   load_swaggerDocPage();
		   } ).catch( ( error ) => {
			   console.error( 'Errore:', error );
		   } );

		   function load_swaggerDocPage() {
			   document.getElementById( "display" ).innerHTML = `<embed type="text/html" src="${ swaggerDocUrl }" width="100%" height="800">`;
		   }
	   } );
