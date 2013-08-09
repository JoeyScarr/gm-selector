"use strict";

// Declares the selection module, which contains the algorithm for GM selection.
var MOD_selection = angular.module('selection', ['util']);

// Set up a gmSelector service, which selects ground motions.
MOD_selection.factory('gmSelector', ['util', function(util) {
	
	// Helper functions
	var error = util.error;
	var warning = util.warning;
	
	var getScaleFactorIndex = function(IMName) {
		// Based on the name of the IM, returns an index of 0, 1, or 2.
		// This index is used in the relation
		//     ScaledIMiValues = UnscaledIMiValues*(Scalefactors^index);
		// Ds575, Ds595 are constant with scale factor so index = 0
		// PGA, PGV, SA etc are linear with scale factor so index = 1
		// IA is quadratic with scale factor so index = 2
		if (IMName == 'Ds595' || IMName == 'Ds575') {
			return 0.0;
		} else if (IMName == 'PGA' || IMName == 'PGV' || IMName.substr(0,2) == 'SA' ||
							 IMName == 'CAV' || IMName == 'ASI' || IMName == 'SI' || IMName == 'DSI') {
			return 1.0;
		} else if (IMName == 'IA') {
			return 2.0;
		} else {
			error('We don\'t know what scale factor index to use for ' + IMName);
			return NaN;
		}
	};
	
	return {
		selectGroundMotions: function(GCIMdata, database, debugOutputFunc) {
			// TODO: Make these parameters instead
			var Ngms = 20;
			var Nreplicates = 5;
			var repeatability = true;
			var allowAsRecordedMotions = true;
			
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
			
			if (allowAsRecordedMotions) {
				// Step 3a: Get the prospective ground motions from the desired database(s)
				// TODO: Remove IMs that are not used in this analysis.
				
				// Determine the scale factor required for each ground motion and scale it
				for (var i = 0; i < database.length; ++i) {
					var groundMotion = database[i];
					var IMjValue = groundMotion.IM[GCIMdata.IMjName];
					var index = getScaleFactorIndex(GCIMdata.IMjName);
					var scaleFactor = Math.pow(GCIMdata.IML / IMjValue, 1.0 / index);
					
					// Scale each intensity measure of the ground motion
					for (var IMname in groundMotion.IM) {
						var IMvalue = groundMotion.IM[IMname];
						var index = getScaleFactorIndex(IMname);
						groundMotion.IM[IMname] = IMvalue * Math.pow(scaleFactor,index);
					}
				}
			}
			
			// Step 5: loop over the number of replicates to consider
			if (repeatability) {
				Math.seedrandom(0);
			}
			var replicateIndex = [];
			var selectedGroundMotionReplicateIndex = [];
			var R = []; // The global residual for each replicate
			var minR = Number.MAX_VALUE;
			var minRIndex = -1;
			for (var k = 0; k < Nreplicates; ++k) {
				// Get a random sample of simulated ground motions (a "replicate")
				replicateIndex.push(util.sample(Ngms));
				var selectedGroundMotions = [];
				for (var i = 0; i < replicateIndex[k]; ++i) {
					var realizationIndex = replicateIndex[k][i];
					
					// Loop over all of the actual ground motions and select the best fitting one.
					var minResidual = Number.MAX_VALUE;
					var minResidualIndex = -1;
					for (var j = 0; j < database.length; ++j) {
						var groundMotion = database[j];
						var residuals = [];
						var residualSum = 0;
						for (var ii = 0; ii < GCIMdata.numIMi; ++ii) {
							var im = GCIMdata.IMi[ii];
							var scaledProspectiveValue = groundMotion.IM[im.name];
							var simulatedValue = im.realizations[realizationIndex][0];
							var simulatedSigma = im.realizations[realizationIndex][1];
							var residual = im.weighting * Math.pow(Math.log(scaledProspectiveValue / simulatedValue) / simulatedSigma, 2);
							residuals.push(residual);
							residualSum += residual;
						}
						
						if (residualSum < minResidual) {
							minResidual = residualSum;
							minResidualIndex = j;
						}
					}
					
					// Store the best-fitting ground motion.
					selectedGroundMotions.push(database[minResidualIndex]);
				}
				selectedGroundMotionReplicateIndex.push(selectedGroundMotions);
				
				// Compute the KS values for each IMi and hence the value of the
				// 'global' residual for this replicate, R (see Eqn 11)
				var rSum = 0;
				for (var i = 0; i < GCIMdata.numIMi; ++i) {
					var weight = GCIMdata.IMi[i].weighting;
					// TODO: Go over this with Brendon
					var targetCDF = [];
					var ks = util.ks_critical_value(Ngms, 0.05);
					rSum += weight * ks * ks;
				}
				R.push(rSum);
				if (rSum < minR) {
					minR = rSum;
					minRIndex = k;
				}
			}
			
			// The replicate with minimum R is at index minRIndex
			debugOutputFunc('\n\nBest-fitting replicate: index ' + minRIndex);
			debugOutputFunc('R: ' + minR);
			debugOutputFunc('Simulated realizations used: ' + JSON.stringify(replicateIndex[minRIndex]));
			debugOutputFunc('Ground motions selected:');
			debugOutputFunc(JSON.stringify(selectedGroundMotionReplicateIndex[minRIndex]),null,2);
		}
	};
}]);

// Set up a database service, which deals with loading the database of ground motions.
MOD_selection.factory('database', ['$http', function($http) {
	var IMNames = ['PGA','PGV','SA (0.01s)','SA (0.02s)','SA (0.03s)','SA (0.04s)','SA (0.05s)','SA (0.075s)','SA (0.1s)','SA (0.15s)',
    'SA (0.2s)','SA (0.25s)','SA (0.3s)','SA (0.4s)','SA (0.5s)','SA (0.75s)','SA (1.0s)','SA (1.5s)','SA (2.0s)','SA (3.0s)','SA (4.0s)',
    'SA (5.0s)','SA (7.5s)','SA (10.0s)','IA','Ds595','Ds575','CAV','ASI','SI','DSI'];
	return {
		// Loads a database from the server.
		// Calls callback with the data when it arrives, or error if something goes wrong.
		loadDatabase: function(dbName, callback, errorCallback) {
			$http.get('data/' + dbName + '.json')
				.success(function(data, status, headers, config) {
					// Convert the array data into objects.
					for (var i = 0; i < data.length; i++) {
						var convertedData = {
							DatabaseName: dbName,
							GMID: data[i][0],
							EQID: data[i][1],
							Mw: data[i][2],
							mech: data[i][5],
							Ztor: data[i][10],
							Rjb: data[i][13],
							Rrup: data[i][14],
							Vs30: data[i][15],
							freqMin: data[i][16],
							IM: {}
						};
						for (var j = 0; j < IMNames.length; ++j) {
							convertedData.IM[IMNames[j]] = data[i][17 + j];
						}
						data[i] = convertedData;
					}
					callback(data);
				}).error(function(data, status, headers, config) {
					errorCallback(status);
				});
		}
	};
}]);