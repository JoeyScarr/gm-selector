"use strict";

// Create the main controller in the base app module.
var app = angular.module('app');

app.filter('odd', function() {
	return function(items) {
		var filtered = [];
		angular.forEach(items, function(item, index) {
			if (index % 2 == 1) {
				filtered.push(item);
			}
		});
		return filtered;
	}
});

app.filter('even', function() {
	return function(items) {
		var filtered = [];
		angular.forEach(items, function(item, index) {
			if (index % 2 == 0) {
				filtered.push(item);
			}
		});
		return filtered;
	}
});

app.controller('MainCtrl', ['$scope', 'inputReader', 'util', 'gmSelector', 'database',
														function($scope, inputReader, util, gmSelector, database) {
	$scope.inputJsonString = '';
	
	var xmin = Math.exp(-5.5);
	var xmax = Math.exp(0.5);
	var func = function(x) {
		return 1.0 / Math.pow(x, 2);
	};
	
	$scope.databases = [
		{name:'NGAdatabase', label:'NGA Database'}
	];
	
	$scope.input = null;
	$scope.chartData = [];
	$scope.visibleChart = 'SA';
	$scope.selectionOutput = null;
	$scope.selectionOutputString = null;
	$scope.debugOutput = null;
	
	$scope.dbLoaded = false;
	$scope.dbLoading = false;
	$scope.databaseName = '';
	$scope.databaseData = null;
	
	$scope.$watch('databaseName', function(newVal, oldVal) {
		$scope.dbLoaded = false;
		$scope.databaseData = null;
		if (newVal) {
			$scope.dbLoading = true;
			database.loadDatabase(newVal, function(data) {
				$scope.databaseData = data;
				$scope.databaseFirstLine = data[0];
				$scope.dbLoaded = true;
				$scope.dbLoading = false;
			}, function(status) {
				$scope.databaseFirstLine = status;
				$scope.dbLoading = false;
			});
		}
	}, true);
	
	
	
	$scope.selectGMs = function() {
		$scope.debugOutput = '';
		$scope.selectionOutput = gmSelector.selectGroundMotions($scope.input, $scope.databaseData,
			function(output) {
				$scope.debugOutput += output + '\n';
			});
		$scope.selectionOutputString = JSON.stringify($scope.selectionOutput, null, 2);
	};
	
	// Generates and returns charts for the parsed input data.
	$scope.plot = function(data) {
		var charts = [];
		for (var i = 0; i < data.numIMi; ++i) {
			var IMi = data.IMi[i];
			var chart = {
				name: IMi.name,
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
						'data': IMi.realizationCDF,
						'color': 'blue'
					}
				]
			}
			charts.push(chart);
		}
		return charts;
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
				
				medianLine.push([period, util.median(IMi.sortedRealizations)]);
			}
		}
		
		// If there were SAs in the data, build the chart.
		if (realizationLines.length > 0) {
			chart = {
				name: 'SA',
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
							var SAChartData = $scope.plotSA($scope.input);
							if (SAChartData) {
								$scope.chartData.splice(0,0,SAChartData);
							}
							
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