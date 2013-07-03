"use strict";

// Declares the selection module, which contains the algorithm for GM selection.
var MOD_selection = angular.module('selection', ['util']);

// Set up a gmSelector service, which selects ground motions.
MOD_selection.factory('gmSelector', ['util', function(util) {
	
	// Helper functions
	var error = util.error;
	var warning = util.warning;
	
	return {
		selectGroundMotions: function(GCIMdata) {
			// TODO: Make these parameters instead
			var Ngms = 20;
			var Nreplicates = 5;
			var repeatability = true;
			
			// Step 1: Get the GCIMrealization data
			// if the number of GCIM realizations is less than Ngms then set Ngms = numIMiRealizations
			if (GCIMdata.numIMiRealizations == 0) {
				error('0 GCIM realizations present.');
				return null;
			} else if (GCIMdata.numIMiRealizations < Ngms) {
				warning('Ngms (' + Ngms + ') > numIMiRealizations (' + numIMiRealizations +
							'). Setting Ngms to ' + numIMiRealizations);
				Ngms = GCIMdata.numIMiRealizations;
			}
			// Check the number of possible combinations and ensure that it is less than
			// the number of replicates
			var Ncomb = util.binomial(GCIMdata.numIMiRealizations,Ngms);
			if (Ncomb < Nreplicates) {
				warning('Nreplicates (' + Nreplicates + ') > Ncomb (' + Ncomb +
							'). Setting Nreplicates to ' + Ncomb + '.\n' +
							'The number of realizations (numIMiRealizations) should be increased.');
				Nreplicates = Ncomb;
			}
			// Get the approximate median and lognormal sigma for each GCIM distribution
			// (for use in approximate bias assessment)
			for (var i = 0; i < GCIMdata.numIMi; ++i) {
				var IMi = GCIMdata.IMi[i];
				// Swap the x and y of the CDF for interpolation
				var values = $.map(IMi.GCIMvalues, function(val, i) {
					return [[val[1], val[0]]];
				});
				var median = util.interp_array(values, 0.5);
				var x84 = util.interp_array(values, 0.84);
				var x16 = util.interp_array(values, 0.16);
				var sigma = 0.5 * Math.log(x84 / x16);
				
				IMi.median = median;
				IMi.sigma = sigma;
			}
			
			// Step 3a: ...
		}
	};
}]);

// Set up a database service, which deals with loading the database of ground motions.
MOD_selection.factory('database', ['$http', function($http) {
	return {
		// Loads a database from the server.
		// Calls callback with the data when it arrives, or error if something goes wrong.
		loadDatabase: function(dbName, callback, errorCallback) {
			$http.get('data/' + dbName + '.json')
				.success(function(data, status, headers, config) {
					// TODO: Convert data into some kind of structure here.
					callback(data);
				}).error(function(data, status, headers, config) {
					errorCallback(status);
				});
		}
	};
}]);