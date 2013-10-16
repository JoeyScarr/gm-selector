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
	
	// This binary search finds the index of the first element >= x.
	// NOTE: Requires a list of [a,b] pairs and treats a as the key.
	// Returns -1 if the value is outside the list.
	var binary_search = function(data, x) {
		if (data.length < 1 || x < data[0][0] || x > data[data.length-1][0]) {
			return -1;
		}
		
		// Adapted from http://www.cplusplus.com/reference/algorithm/lower_bound/
		var count = data.length;
		var step;
		var idx = 0;
		var first = 0;
		while (count > 0) {
			idx = first;
			step = Math.floor(count / 2);
			idx += step;
			if (data[idx][0] < x) {
				first = idx+1;
				count -= step + 1;
			} else {
				count = step;
			}
		}
		return first;
	};
	
	var interp = function(a, b, f) {
		return a + f * (b - a);
	};
	
	var interp_array = function(data, x) {
		if (data.length < 1 || x < data[0][0] || x > data[data.length-1][0]) {
			error('interp_array() failed! Value ' + x + ' was outside the data bounds.')
			return null;
		}
		// First, binary search for x.
		var i = binary_search(data, x);
		// Check to see if interpolation is actually required.
		if (i == 0 || data[i][0] == data[i-1][0]) {
			return data[i][1];
		}
		return data[i-1][1] + ((x - data[i-1][0])/(data[i][0]-data[i-1][0]))*(data[i][1]-data[i-1][1]);
	};
	
	var log10 = function(val) {
		return Math.log(val) / Math.LN10;
	};
	
	return {
		error: error,
		warning: warning,
		defaultFor: function(arg, val) {
			return typeof arg !== 'undefined' ? arg : val;
		},
		binomial: function(N, K) {
			var res = 1;
			for (var k = 0; k < K; ++k) {
				res = res * (N-k) / (k+1);
			}
			return res;
		},
		median: function(sortedvalues) {
			if (sortedvalues.length < 1) {
				error('median() failed! List was empty.')
				return null;
			}
			var half = Math.floor(sortedvalues.length/2);
			if(sortedvalues.length % 2) {
				return sortedvalues[half];
			} else {
				return (sortedvalues[half-1] + sortedvalues[half]) / 2.0;
			}
		},
		binary_search: binary_search,
		interpolate: interp,
		interp_array: interp_array,
		sample: function (n, k) {
			k = Math.min(n, k);
			var arr = new Array(n);
			for (var j = 0; j < n; j++) {
				arr[j] = j;
			}
			var shuffled = arr.slice(0), i = arr.length, min = i - k, temp, index;
			while (i-- > min) {
				index = Math.floor(i * Math.random());
				temp = shuffled[index];
				shuffled[index] = shuffled[i];
				shuffled[i] = temp;
			}
			return shuffled.slice(min);
		},
		ks_critical_value: function(n, alpha) {
			// Make sure n is at least 1
			if (n < 1) {
				error('n was less than 1');
				return null;
			}
			
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
					var asymptoticStat = Math.sqrt(-0.5 * Math.log(alpha1) / n);
					var criticalValue = asymptoticStat - 0.16693 / n - A / Math.pow(n, 1.5);
					return Math.min(criticalValue , 1 - alpha1);
				}
			} else {
				error('alpha ' + alpha1 + ' was outside the required bounds [0.005,0.10]');
				return null;
			}
		},
		ks_diff: function(groundMotions, im) {
			// First extract the values for this IM from the selected ground motions.
			var actualValues = [];
			for (var i = 0; i < groundMotions.length; ++i) {
				actualValues.push(groundMotions[i].scaledIM[im.name]);
			}
			
			// Build the CDF.
			var actualCDF = [];
			// First, sort in ascending order.
			actualValues.sort(function(a,b){return a-b;});
			// Then iterate over all realizations and count them.
			var count = 0.0;
			for (var i = 0; i < actualValues.length; ++i) {
				actualCDF.push([actualValues[i], count / actualValues.length]);
				count += 1.0;
				actualCDF.push([actualValues[i], count / actualValues.length]);
			}
			
			// Find the largest distance between the actual CDF and the target CDF (from the GCIM input).
			var maxDiff = 0;
			for (var i = 0; i < actualCDF.length; ++i) {
				var diff;
				if (actualCDF[i][0] < im.GCIMvalues[0][0]) {
					diff = actualCDF[i][1]; // This x-value falls before the beginning of the target CDF
				} else if (actualCDF[i][0] > im.GCIMvalues[im.GCIMvalues.length-1][0]) {
					diff = 1 - actualCDF[i][1]; // This x-value falls past the end of the target CDF
				} else {
					diff = Math.abs(actualCDF[i][1] - interp_array(im.GCIMvalues, actualCDF[i][0]));
				}
				maxDiff = Math.max(maxDiff, diff);
			}
			return maxDiff;
		},
		build_cdf: function(values) {
			var numValues = values.length;
			// First, sort in ascending order.
			var sortedValues = values.slice(0);
			sortedValues.sort(function(a,b){return a-b;});
			// Then iterate over all realizations and count them.
			var count = 0.0;
			var cdf = [];
			for (var j = 0; j < numValues; ++j) {
				cdf.push([sortedValues[j],count/numValues]);
				count += 1.0;
				cdf.push([sortedValues[j],count/numValues]);
			}
			return cdf;
		}
	};
});