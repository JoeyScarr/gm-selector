"use strict";

// Create the main controller in the base app module.
var app = angular.module('app');

app.controller('MainCtrl', ['$scope', 'inputReader', function($scope, inputReader) {
	$scope.parsedOutput = '{}';
	
	// Called when the user selects a new input file.
	$scope.handleFileSelect = function(event) {
		$scope.$apply(function($scope) {
			var f = event.target.files[0];
			if (f) {
				var r = new FileReader();
				r.onload = function(e) {
					$scope.$apply(function($scope) {
						try {
							var output = inputReader.parse(e.target.result);
							
							$scope.parsedOutput = JSON.stringify(output, null, 2);
						} catch (err) {
							alert("Error: Invalid file format.");
						}
					});
				};
				r.readAsText(f);
			}
		});
	};
	
	document.getElementById('inputFileSelect').addEventListener('change', $scope.handleFileSelect);
}]);