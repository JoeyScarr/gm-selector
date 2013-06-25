"use strict";

// Create the main controller in the base app module.
var app = angular.module('app');

app.controller('MainCtrl', ['$scope', 'inputReader', function($scope, inputReader) {
	$scope.parsedOutput = '';
	
	var xmin = Math.exp(-5.5);
	var xmax = Math.exp(0.5);
	var func = function(x) {
		return 1.0 / Math.pow(x, 2);
	};
	
	$scope.chartData = [];
	
	// Generates and returns charts for the parsed input data.
	$scope.plot = function(data) {
		var charts = [];
		for (var i = 0; i < data.numIMi; ++i) {
			var IMi = data.IMi[i];
			var chart = {
				xAxisLabel: IMi.name,
				yAxisLabel: 'Cumulative Probability, CDF',
				lines: [
					{
						'name': 'GCIM distribution',
						'isDiscrete': true,
						'data': IMi.GCIMvalues,
						'color': 'red'
					},
					{
						'name': 'Realizations',
						'isDiscrete': true,
						'drawCircles': true,
						'data': IMi.realizationCDF,
						'color': 'blue'
					}
				]
			}
			charts.push(chart);
		}
		return charts;
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
							$scope.chartData = $scope.plot(output);
							
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