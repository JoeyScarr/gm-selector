"use strict";

// Declares the util module, which contains mathematical functions and other helper methods.
var MOD_util = angular.module('util', []);

// Set up a util service.
MOD_util.factory('util', function() {
	
	// Private functions
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
	
	var interp = function(a, b, f) {
		return a + f * (b - a);
	};
	
	var interp_array = function(data, x) {
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
	};
	
	var log10 = function(val) {
		return Math.log(val) / Math.LN10;
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
		interp_array: interp_array,
		ks_critical_value: function(n, alpha) {
			// We only want a two-sided test, so halve the significance level
			var alpha1 = alpha / 2;
			
			if (alpha1 >= 0.005 && alpha1 <= 0.10) {
				// Calculate the critical value which 'KSstatistic' must exceed for the null
				// hypothesis to be rejected. If the sample size 'n' is greater than 20, use
				// Miller's approximation; otherwise interpolate into his 'exact' table.
				if (n <= 20) {
					// Exact K-S test critical values are solutions of an nth order polynomial.
					// Miller's approximation is excellent for sample sizes n > 20. For n <= 20,
					// Miller tabularized the exact critical values by solving the nth order
					// polynomial. These exact values for n <= 20 are hard-coded into the matrix
					// 'exact' shown below. Rows 1:20 correspond to sample sizes n = 1:20.
					var a1 = [0.00500, 0.01000, 0.02500, 0.05000, 0.10000];
          var exact =  [[0.99500, 0.99000, 0.97500, 0.95000, 0.90000],
												[0.92929, 0.90000, 0.84189, 0.77639, 0.68377],
												[0.82900, 0.78456, 0.70760, 0.63604, 0.56481],
												[0.73424, 0.68887, 0.62394, 0.56522, 0.49265],
												[0.66853, 0.62718, 0.56328, 0.50945, 0.44698],
												[0.61661, 0.57741, 0.51926, 0.46799, 0.41037],
												[0.57581, 0.53844, 0.48342, 0.43607, 0.38148],
												[0.54179, 0.50654, 0.45427, 0.40962, 0.35831],
												[0.51332, 0.47960, 0.43001, 0.38746, 0.33910],
												[0.48893, 0.45662, 0.40925, 0.36866, 0.32260],
												[0.46770, 0.43670, 0.39122, 0.35242, 0.30829],
												[0.44905, 0.41918, 0.37543, 0.33815, 0.29577],
												[0.43247, 0.40362, 0.36143, 0.32549, 0.28470],
												[0.41762, 0.38970, 0.34890, 0.31417, 0.27481],
												[0.40420, 0.37713, 0.33760, 0.30397, 0.26588],
												[0.39201, 0.36571, 0.32733, 0.29472, 0.25778],
												[0.38086, 0.35528, 0.31796, 0.28627, 0.25039],
												[0.37062, 0.34569, 0.30936, 0.27851, 0.24360],
												[0.36117, 0.33685, 0.30143, 0.27136, 0.23735],
												[0.35241, 0.32866, 0.29408, 0.26473, 0.23156]];
					var data = [];
					for (var i = 0; i < a1.length; ++i) {
						data.push([a1[i],exact[n-1][i]]);
					}
					return interp_array(data, alpha1);
				} else {
					var A = 0.09037 * Math.pow(-log10(alpha1), 1.5) + 0.01515 * Math.pow(log10(alpha1), 2) - 0.08467 * alpha1 - 0.11143;
					var asymptoticStat = Math.sqrt(-0.5 * Math.pow(log(alpha1), n));
					var criticalValue = asymptoticStat - 0.16693 / n - A / Math.pow(n, 1.5);
					return Math.min(criticalValue , 1 - alpha1);
				}
			} else {
				return NaN;
			}
		}
	};
});