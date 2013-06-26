"use strict";

// Declares the util module, which contains mathematical functions and other helper methods.
var MOD_util = angular.module('util', []);

// Set up a util service.
MOD_util.factory('util', function() {
	
	// Private functions
	var interp = function(a, b, f) {
		return a + f * (b - a);
	};
	
	var error = function(error) {
		console.log('ERROR: ' + error);
	};
	
	var warning = function(error) {
		console.log('WARNING: ' + error);
	};
	
	// This binary search finds the index of the highest number <= x.
	var binary_search = function(data, x) {
		var low = 0, high = data.length - 1, i, comparison;
		while (low <= high) {
			i = Math.floor((low + high) / 2);
			if (data[i][0] < find) { low = i + 1; continue; };
			if (data[i][0] > find) { high = i - 1; continue; };
			return i;
		}
		return null;
	};
	
	return {
		error: error,
		warning: warning,
		binomial: function(N, K) {
			var res = 1;
			for (var k = 0; k < K; ++k) {
				res = res * (N-k) / (k+1);
			}
			return res;
		},
		median: function(sortedvalues) {
			var half = Math.floor(sortedvalues.length/2);
			if(sortedvalues.length % 2) {
				return sortedvalues[half][0];
			} else {
				return (sortedvalues[half-1][0] + sortedvalues[half][0]) / 2.0;
			}
		},
		binary_search: binary_search,
		interp_array: function(data, x) {
			if (x < data[0][0] || x > data[data.length-1][0]) {
				error('interp_array() failed! Value ' + x + ' was outside the data bounds.')
				return -1;
			}
			// First, binary search for x.
			var i = binary_search(data, x);
			// Check to see if interpolation is actually required.
			if (data[i][0] == data[i+1][0]) {
				return data[i][1];
			}
			return data[i][1] + ((x - data[i][0])/(data[i+1][0]-data[i][0]))*(data[i+1][1]-data[i][1]);
		}
	};
});