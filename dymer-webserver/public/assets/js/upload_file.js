angular.module('app', []).
directive('fileInput',['$parse', function($parse){
	return {
		restrict:'A',
		link:function(scope,elm,attrs){
			elm.bind('change', function(){
				$parse(attrs.fileInput)
				.assign(scope,elm[0].files)
				scope.$apply()
			});
		}
	}
}]).
controller('ctrl',['$scope', '$http',
	function($scope, $http) {
	$scope.filesChanged = function(elm){
		$scope.files=elm.files
		$scope.$apply();
	}
	$scope.upload = function(){
		var fd = new FormData()
		angular.forEach($scope.files,function(file){
			fd.append('file',file)
		})
		$http.post('https://<your_sample_application_url>/resource/api/fileupload', fd, 
				{
			transformRequest:angular.identity,
			headers: {'Content-Type':undefined}
				})
				.success(function(d) {					
					$scope.message = "Upload Successful!";
					$scope.successmessagebox = true;
					console.log(d);
				})
	}
}
])