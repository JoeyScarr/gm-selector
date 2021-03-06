"use strict";

// Declares the selection module, which contains the algorithm for GM selection.
var MOD_selection = angular.module('selection', ['util']);

// Set up a gmSelector service, which selects ground motions.
MOD_selection.factory('gmSelector', ['util', function(util) {
	
	// Helper functions
	var error = util.error;
	var warning = util.warning;
	var defaultFor = util.defaultFor;
	
	return {
		/***************************************************************
			"Private" functions that are only exposed for unit testing.
		***************************************************************/
		getScaleFactorIndex: function(IMName) {
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
		},
		// Computes the median and log-normal sigma of the realizations for each IM.
		computeMediansAndSigmas: function(GCIMdata) {
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
		},
		// Scales a database of actual ground motions, given the IML and conditioning IM.
		scaleGroundMotions: function(database, IML, IMjName) {
			// Determine the scale factor required for each ground motion and scale it
			for (var i = 0; i < database.length; ++i) {
				var groundMotion = database[i];
				var IMjValue = groundMotion.IM[IMjName];
				var index = this.getScaleFactorIndex(IMjName);
				var scaleFactor = Math.pow(IML / IMjValue, 1.0 / index);
				
				// Scale each intensity measure of the ground motion
				groundMotion.scaleFactor = scaleFactor;
				groundMotion.scaledIM = {};
				for (var IMname in groundMotion.IM) {
					var IMvalue = groundMotion.IM[IMname];
					var index = this.getScaleFactorIndex(IMname);
					groundMotion.scaledIM[IMname] = IMvalue * Math.pow(scaleFactor,index);
				}
			}
		},
		// Select the actual ground motions that best fit a sample of simulated ones. 
		selectBestFittingGroundMotions: function(database, GCIMdata, sampleIndices) {
			var selectedGroundMotions = [];
			for (var i = 0; i < sampleIndices.length; ++i) {
				var realizationIndex = sampleIndices[i];
				
				// Loop over all of the actual ground motions and select the best fitting one.
				var minResidual = Number.MAX_VALUE;
				var minResidualIndex = -1;
				for (var j = 0; j < database.length; ++j) {
					var groundMotion = database[j];
					var residuals = [];
					var residualSum = 0;
					// Loop over the IMs and calculate the residual for each.
					for (var k = 0; k < GCIMdata.numIMi; ++k) {
						var im = GCIMdata.IMi[k];
						var scaledActualValue = groundMotion.scaledIM[im.name];
						var simulatedValue = im.realizations[realizationIndex][0];
						var simulatedSigma = im.realizations[realizationIndex][1];
						var residual = im.weighting * Math.pow(Math.log(scaledActualValue / simulatedValue) / simulatedSigma, 2);
						residuals.push(residual);
						residualSum += residual;
					}
					
					if (residualSum < minResidual) {
						minResidual = residualSum;
						minResidualIndex = j;
					}
				}
				
				// Add metadata about the selection process for debugging.
				database[minResidualIndex].residual = minResidual;
				database[minResidualIndex].index = minResidualIndex;
				// Store the best-fitting ground motion.
				selectedGroundMotions.push(database[minResidualIndex]);
			}
			return selectedGroundMotions;
		},
		
		/***************************************************************
			"Public" functions.
		***************************************************************/
		// The main algorithm itself.
		selectGroundMotions: function(GCIMdata, database, debugOutputFunc,
																	Ngms, Nreplicates, repeatability, alpha) {
			// Parameter default values
			debugOutputFunc = util.defaultFor(debugOutputFunc, function(){});
			Ngms = util.defaultFor(Ngms, 30);
			Nreplicates = Math.max(1, util.defaultFor(Nreplicates, 1));
			repeatability = util.defaultFor(repeatability, true);
			alpha = util.defaultFor(alpha, 0.1);
			
			// Do some bounds checking.
			// If the number of GCIM realizations is less than Ngms then set Ngms = numIMiRealizations
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
			
			// Normalize IM weightings.
			var sumWeights = 0;
			for (var i = 0; i < GCIMdata.numIMi; ++i) {
				sumWeights += GCIMdata.IMi[i].weighting;
			}
			if (Math.abs(1 - sumWeights) > 0.000000001) {
				warning('The sum of the IM weightings (' + sumWeights +
								') was not 1.0 so it has been renormalized.')
				for (var i = 0; i < GCIMdata.numIMi; ++i) {
					GCIMdata.IMi[i].weighting /= sumWeights;
				}
			}
			
			// Get the approximate median and lognormal sigma for each GCIM distribution
			// (for use in approximate bias assessment)
			this.computeMediansAndSigmas(GCIMdata);
			
			// TODO: Remove IMs that are not used in this analysis.
			this.scaleGroundMotions(database, GCIMdata.IML, GCIMdata.IMjName);
			
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
				replicateIndex.push(util.sample(GCIMdata.numIMiRealizations, Ngms));
				var selectedGroundMotions = this.selectBestFittingGroundMotions(database, GCIMdata, replicateIndex[k]);
				selectedGroundMotionReplicateIndex.push(selectedGroundMotions);
				
				// Print debug output for the selected ground motions
				for (var i = 0; i < selectedGroundMotions.length; i++) {
					var gm = selectedGroundMotions[i];
					debugOutputFunc('Selected record for realization ' + i +
													' is the ground motion with index ' + gm.index +
													' and residual ' + gm.residual);
				}
				
				// Compute the KS values for each IMi and hence the value of the
				// 'global' residual for this replicate, R (see Eqn 11)
				var rSum = 0;
				for (var i = 0; i < GCIMdata.numIMi; ++i) {
					var im = GCIMdata.IMi[i];
					var ksDiff = util.ks_diff(selectedGroundMotions, im);
					
					rSum += im.weighting * ksDiff * ksDiff;
				}
				R.push(rSum);
				if (rSum < minR) {
					minR = rSum;
					minRIndex = k;
				}
			}
			
			// Store the K-S differences for the best-fitting replicate on each IM.
			var selectedGMs = selectedGroundMotionReplicateIndex[minRIndex];
			for (var i = 0; i < GCIMdata.numIMi; ++i) {
				var im = GCIMdata.IMi[i];
				im.ksDiff = util.ks_diff(selectedGMs, im);
			}
			
			// The replicate with minimum R is at index minRIndex
			debugOutputFunc('\n\nBest-fitting replicate: index ' + minRIndex);
			debugOutputFunc('R: ' + minR);
			debugOutputFunc('Simulated realizations used: ' + JSON.stringify(replicateIndex[minRIndex]));
			debugOutputFunc('Ground motions selected:');
			var selectedGMIDs = $.map(selectedGroundMotionReplicateIndex[minRIndex], function(gm) {
				return gm.GMID;
			});
			debugOutputFunc(JSON.stringify(selectedGMIDs));
			
			var output = {
				simulatedRealizationsUsed: replicateIndex[minRIndex],
				selectedGroundMotions: selectedGroundMotionReplicateIndex[minRIndex],
				R: minR,
				ksCriticalValue: util.ks_critical_value(Ngms, alpha),
				IMi: GCIMdata.IMi
			};
			
			return output;
		}
	};
}]);

// Set up a database service, which deals with loading the database of ground motions.
MOD_selection.factory('database', ['$http', function($http) {
	var IMNames = ['PGA','PGV','SA (0.01s)','SA (0.02s)','SA (0.03s)','SA (0.04s)','SA (0.05s)','SA (0.075s)','SA (0.1s)','SA (0.15s)',
    'SA (0.2s)','SA (0.25s)','SA (0.3s)','SA (0.4s)','SA (0.5s)','SA (0.75s)','SA (1.0s)','SA (1.5s)','SA (2.0s)','SA (3.0s)','SA (4.0s)',
    'SA (5.0s)','SA (7.5s)','SA (10.0s)','IA','Ds595','Ds575','CAV','ASI','SI','DSI'];
	
	return {
		// Retrieves a database from the server with a JSON call.
		fetchDatabase: function(dbName, callback, errorCallback) {
			$http.get('data/' + dbName + '.json')
				.success(function(data, status, headers, config) {
					callback(data);
				}).error(function(data, status, headers, config) {
					errorCallback(status);
				});
		},
		
		// Loads a database from the server, giving meaningful names to numerical fields.
		// Calls callback with the data when it arrives, or error if something goes wrong.
		loadDatabase: function(dbName, callback, errorCallback) {
			this.fetchDatabase(dbName, function(data) {
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
				}, errorCallback);
		}
	};
}]);