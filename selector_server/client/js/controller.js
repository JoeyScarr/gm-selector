"use strict";

// Create the main controller in the base app module.
var app = angular.module('app');

app.controller('MainCtrl', ['$scope', 'inputReader', function($scope, inputReader) {
	$scope.inputJsonString = '';
	
	var xmin = Math.exp(-5.5);
	var xmax = Math.exp(0.5);
	var func = function(x) {
		return 1.0 / Math.pow(x, 2);
	};
	
	$scope.chartData = [];
	$scope.SAChartData = null;
	
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
	
	var median = function(sortedvalues) {
		var half = Math.floor(sortedvalues.length/2);
		if(sortedvalues.length % 2) {
			return sortedvalues[half][0];
		} else {
			return (sortedvalues[half-1][0] + sortedvalues[half][0]) / 2.0;
		}
	};
	
	// Generates a plot of Spectral Acceleration against period, T (if SA data is present).
	$scope.plotSA = function(data) {
		var chart = null;
		var realizationLines = [];
		var medianLine = [];
		for (var i = 0; i < data.numIMi; ++i) {
			var IMi = data.IMi[i];
			if (IMi.name.substr(0,2) == 'SA') {
				// Initialize the lines array if it's empty
				if (realizationLines.length == 0) {
					for (var j = 0; j < data.numIMiRealizations; ++j) {
						realizationLines.push([]);
					}
				}
				
				var period = IMi.period;
				// Add points to each realization for this period
				for (var j = 0; j < data.numIMiRealizations; ++j) {
					realizationLines[j].push([period, IMi.realizations[j][0]]);
				}
				
				medianLine.push([period, median(IMi.sortedRealizations)]);
			}
		}
		
		// If there were SAs in the data, build the chart.
		if (realizationLines.length > 0) {
			chart = {
				xAxisLabel: 'Period, T (s)',
				yAxisLabel: 'Spectral acceleration, SA (g)',
				lines: []
			}
			for (var i = 0; i < realizationLines.length; ++i) {
				chart.lines.push({
					'name': 'Realization ' + (i + 1),
					'isDiscrete': true,
					'data': realizationLines[i],
					'color': 'blue',
					'showLegend': false
				});
			}
			
			// Add median line
			chart.lines.push({
				'name': 'GCIM median',
				'isDiscrete': true,
				'data': medianLine,
				'color': 'red'
			});
		}
		
		return chart;
	}
	
	// Called when the user selects a new input file.
	$scope.handleFileSelect = function(event) {
		$scope.$apply(function($scope) {
			var f = event.target.files[0];
			if (f) {
				var r = new FileReader();
				r.onload = function(e) {
					$scope.$apply(function($scope) {
						try {
							$scope.input = inputReader.parse(e.target.result);
							$scope.chartData = $scope.plot($scope.input);
							$scope.SAChartData = $scope.plotSA($scope.input);
							
							$scope.inputJsonString = JSON.stringify($scope.input, null, 2);
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