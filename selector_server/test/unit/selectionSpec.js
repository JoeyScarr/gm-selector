'use strict';

/* jasmine specs for the selection module go here */

describe('Selection module', function(){
	beforeEach(module('selection'));
	
	describe('getScaleFactorIndex', function() {
		it('should return correct scale factors', inject(function(gmSelector) {
			expect(gmSelector.getScaleFactorIndex('PGA')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('PGV')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('SA')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('IA')).toEqual(2);
			expect(gmSelector.getScaleFactorIndex('Ds595')).toEqual(0);
			expect(gmSelector.getScaleFactorIndex('Ds575')).toEqual(0);
			expect(gmSelector.getScaleFactorIndex('CAV')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('ASI')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('SI')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('DSI')).toEqual(1);
		}));
	});
	
	
	it('should ....', inject(function() {
		//spec body 
	}));

	it('should ....', inject(function() {
		//spec body
	}));
});
