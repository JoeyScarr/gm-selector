'use strict';

/**
 * Tests for the parsing module.
 */

describe('Parsing module', function(){
	beforeEach(module('OpenSHAoutput'));
	beforeEach(module('parsing'));
	
	describe('parse', function() {
		it('should correctly parse the first sample input file', inject(function(inputReader, OpenSHAoutput1) {
			var parsed = inputReader.parse(OpenSHAoutput1);
			// Check the main data
			expect(parsed.IMjName).toEqual('PGA');
			expect(parsed.IMjPeriod).toEqual(-1);
			expect(parsed.IML).toEqual(0.5715106);
			expect(parsed.ProbLevel).toEqual(0.02);
			expect(parsed.numIMi).toEqual(12);
			expect(parsed.numz).toEqual(31);
			expect(parsed.numIMiRealizations).toEqual(100);
			expect(parsed.IMi.length).toEqual(12);
			// Check the first IM
			expect(parsed.IMi[0].name).toEqual('PGV');
			expect(parsed.IMi[0].period).toEqual(-1);
			expect(parsed.IMi[0].weighting).toEqual(1);
			expect(parsed.IMi[0].GCIMvalues.length).toEqual(31);
			expect(parsed.IMi[0].realizations.length).toEqual(100);
			// Check the name of the last IM (SA) and its period
			expect(parsed.IMi[11].name).toEqual('SA (5.0s)');
			expect(parsed.IMi[11].period).toEqual(5.0);
		}));
		it('should correctly parse the second sample input file', inject(function(inputReader, OpenSHAoutput2) {
			var parsed = inputReader.parse(OpenSHAoutput2);
			// Check the main data
			expect(parsed.IMjName).toEqual('SA (1.0s)');
			expect(parsed.IMjPeriod).toEqual(1.0);
			expect(parsed.IML).toEqual(0.213919);
			expect(parsed.ProbLevel).toEqual(0.000404);
			expect(parsed.numIMi).toEqual(14);
			expect(parsed.numz).toEqual(61);
			expect(parsed.numIMiRealizations).toEqual(500);
			expect(parsed.IMi.length).toEqual(14);
			// Check the first IM
			expect(parsed.IMi[0].name).toEqual('SA (0.05s)');
			expect(parsed.IMi[0].period).toEqual(0.05);
			expect(parsed.IMi[0].weighting).toEqual(1);
			expect(parsed.IMi[0].GCIMvalues.length).toEqual(61);
			expect(parsed.IMi[0].realizations.length).toEqual(500);
		}));
	});
});
