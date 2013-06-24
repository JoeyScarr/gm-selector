"use strict";

// Create the main controller in the base app module.
var app = angular.module('app');

app.controller('MainCtrl', ['$scope', 'inputReader', function($scope, inputReader) {
	$scope.parsedOutput = '{}';
	
	var xmin = Math.exp(-5.5);
	var xmax = Math.exp(0.5);
	var func = function(x) {
		return 1.0 / Math.pow(x, 2);
	};
	
	$scope.chart1Data = {
		xAxisLabel: 'X Axis',
		yAxisLabel: 'Y Axis',
		lines: [{
			"name": 'Test',
			"isDiscrete": false,
			"func": func,
			"limits": {
				xmin: xmin,
				xmax: xmax,
				ymin: Math.min(func(xmin),func(xmax)),
				ymax: Math.max(func(xmin),func(xmax))
			}
		}]
	};
	
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