angular.module( 'swaggerCtrl', [] )
	   .controller( 'swaggerController', function ( $scope, $http ) {
		   console.log( "SwaggerCtrl" );
		   console.log( "Generating Swagger page ..." )

		   function load_anotherpage() {
			   document.getElementById( "display" ).innerHTML = '<embed type="text/html" src="http://localhost:8080/dymergui/api/doc/" width="100%" height="800" >';
		   }

		   load_anotherpage();

		   console.log( "Finished!" )

	   } );
