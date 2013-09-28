"use strict";

// Declares the parsing module, which deals with reading input files.
var MOD_parsing = angular.module('parsing', []);

// Set up an inputReader service, which parses OpenSHA output files.
MOD_parsing.factory('inputReader', ['util', function(util) {
	return {
		parse: function(inputText) {
			var lines = $.map(inputText.split('\n'),function(str) {
				return str.replace(/^\s+|\s+$/g, '');
			});
			
			var currentLine = 0;
			
			// First line is only a title
			currentLine++;
			
			// Read the name of the conditioning IM
			var IMjName = lines[currentLine++].substr(17);
			
			// If IMj is SA then get the period
			var IMjPeriod = -1;
			if (IMjName.substr(0,2) == 'SA') {
				IMjPeriod = parseFloat(IMjName.substr(4));
			}
			
			// Now read the next 2 lines and then see if it is IML or Prob based
			var type, IML, ProbLevel;
			var Prob_IML_name1 = lines[currentLine++];
			var Prob_IML_name2 = lines[currentLine++];
			if (Prob_IML_name1.substr(0,4) == 'Prob') {
				type = 1;
				IML = parseFloat(Prob_IML_name2.substr(7));
				ProbLevel = parseFloat(Prob_IML_name1.substr(7));
			} else {
				type = 2;
				IML = parseFloat(Prob_IML_name1.substr(7));
				ProbLevel = parseFloat(Prob_IML_name2.substr(7));
			}
			
			// Read blank line
			currentLine++;
			
			// Get numIMi
			var numIMi = parseInt(lines[currentLine++].substr(28));
			// Get the number of z values for the GCIM distribution for each IMi
			var numz = parseInt(lines[currentLine++].substr(33));
			// Get the number of IMi realizations
			var numIMiRealizations = parseInt(lines[currentLine++].substr(29));
			
			// Read two blank lines
			currentLine += 2;
			
			// Start building the output structure
			var GCIMoutput = {
				IMjName: IMjName,
				IMjPeriod: IMjPeriod,
				IML: IML,
				ProbLevel: ProbLevel,
				numIMi: numIMi,
				numz: numz,
				numIMiRealizations: numIMiRealizations,
				IMi: []
			};
			
			// Read the GCIM CDFs for each IMi
			for (var i = 0; i < numIMi; ++i) {
				// Read dashed line
				currentLine++;
				// Get the name of IMi
				var name = lines[currentLine++].substr(12);
				// If IMi is SA then get the vibration period
				var period = -1;
				if (name.substr(0,2) == 'SA') {
					period = parseFloat(name.substr(4));
				}
				// Now read the IMi and CDF values
				var GCIMvalues = [];
				for (var j = 0; j < numz; j++) {
					var data = lines[currentLine++].match(/\S+/g);
					GCIMvalues.push($.map(data, parseFloat));
				}
				// Read two blank lines
				currentLine += 2;
				var IMi = {
					name: name,
					period: period,
					weighting: 1,
					GCIMvalues: GCIMvalues,
					realizations: []
				};
				GCIMoutput.IMi.push(IMi);
			}
			
			// Read two blank lines
			currentLine += 2;
			
			// Now read the realizations of each IMi.
			for (var i = 0; i < numIMiRealizations; ++i) {
				var data = lines[currentLine++].match(/\S+/g);
				for (var j = 0; j < numIMi; ++j) {
					GCIMoutput.IMi[j].realizations.push([parseFloat(data[2*j+1]),parseFloat(data[2*j+2])]);
				}
			}
			
			// Precompute discrete CDFs for the realizations of each IMi.
			for (var i = 0; i < numIMi; ++i) {
				GCIMoutput.IMi[i].realizationCDF = util.build_cdf(
						$.map(GCIMoutput.IMi[i].realizations, function(val) {
							return val[0];
						}));
			}
			
			// Output the data structure.
			return GCIMoutput;
		}
	};
}]);