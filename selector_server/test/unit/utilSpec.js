'use strict';

/* jasmine specs for the util module go here */

describe('Util module', function(){
	beforeEach(module('util'));
	
	describe('binary search', function() {
		it('should correctly find target in odd-length list', inject(function(util) {
			var list = [[0,0], [1,0], [2,0], [3,0], [4,0]];
			expect(util.binary_search(list, 0)).toEqual(0);
			expect(util.binary_search(list, 1)).toEqual(1);
			expect(util.binary_search(list, 2)).toEqual(2);
			expect(util.binary_search(list, 3)).toEqual(3);
			expect(util.binary_search(list, 4)).toEqual(4);
			expect(util.binary_search(list, -1)).toEqual(-1);
			expect(util.binary_search(list, 0.5)).toEqual(1);
			expect(util.binary_search(list, 3.9)).toEqual(4);
			expect(util.binary_search(list, 5)).toEqual(-1);
		}));
		it('should correctly find target in even-length list', inject(function(util) {
			var list = [[0,0], [1,0], [2,0], [3,0]];
			expect(util.binary_search(list, 0)).toEqual(0);
			expect(util.binary_search(list, 1)).toEqual(1);
			expect(util.binary_search(list, 2)).toEqual(2);
			expect(util.binary_search(list, 3)).toEqual(3);
			expect(util.binary_search(list, -1)).toEqual(-1);
			expect(util.binary_search(list, 0.5)).toEqual(1);
			expect(util.binary_search(list, 1.999)).toEqual(2);
			expect(util.binary_search(list, 3.9)).toEqual(-1);
			expect(util.binary_search(list, -0.1)).toEqual(-1);
		}));
		it('should correctly find target in list of duplicates', inject(function(util) {
			var list = [[1,0], [1,0], [1,0], [3,0]];
			expect(util.binary_search(list, 0)).toEqual(-1);
			expect(util.binary_search(list, 1)).toEqual(0);
			expect(util.binary_search(list, 1.5)).toEqual(3);
			expect(util.binary_search(list, 2)).toEqual(3);
			expect(util.binary_search(list, 2.5)).toEqual(3);
			expect(util.binary_search(list, 3)).toEqual(3);
			expect(util.binary_search(list, 4)).toEqual(-1);
		}));
	});

	describe('interp_array', function() {
		it('should correctly interpolate between two values', inject(function(util) {
			var list = [[0,0], [1,10]];
			expect(util.interp_array(list, -0.1)).toEqual(null);
			expect(util.interp_array(list, 0)).toEqual(0);
			expect(util.interp_array(list, 0.5)).toEqual(5);
			expect(util.interp_array(list, 1)).toEqual(10);
			expect(util.interp_array(list, 1.1)).toEqual(null);
		}));
		it('should correctly interpolate in a list with duplicates', inject(function(util) {
			var list = [[0,0], [1,10], [1,10], [1,10], [2,11]];
			expect(util.interp_array(list, -0.1)).toEqual(null);
			expect(util.interp_array(list, 0)).toEqual(0);
			expect(util.interp_array(list, 0.5)).toEqual(5);
			expect(util.interp_array(list, 1)).toEqual(10);
			expect(util.interp_array(list, 1.1)).toEqual(10.1);
			expect(util.interp_array(list, 2)).toEqual(11);
			expect(util.interp_array(list, 2.1)).toEqual(null);
		}));
	});
	
	describe('binomial', function() {
		it('should correctly calculate binomials', inject(function(util) {
			expect(util.binomial(0, 0)).toEqual(1);
			expect(util.binomial(1, 0)).toEqual(1);
			expect(util.binomial(1, 1)).toEqual(1);
			expect(util.binomial(2, 1)).toEqual(2);
			expect(util.binomial(7, 2)).toEqual(21);
			expect(util.binomial(8, 3)).toEqual(56);
			expect(util.binomial(8, 4)).toEqual(70);
		}));
	});
	
	describe('median', function() {
		it('should return null for an empty list', inject(function(util) {
			expect(util.median([])).toEqual(null);
		}));
		it('should be able to handle a list with a single item', inject(function(util) {
			expect(util.median([[0,1]])).toEqual(0);
		}));
		it('should be able to find medians correctly', inject(function(util) {
			expect(util.median([[0,1],[1,2]])).toEqual(0.5);
			expect(util.median([[0,1],[1,1],[2,1]])).toEqual(1);
		}));
	});
	
	describe('sample', function() {
		it('should return a list of the given size', inject(function(util) {
			expect(util.sample(0).length).toEqual(0);
			expect(util.sample(1).length).toEqual(1);
			expect(util.sample(53).length).toEqual(53);
		}));
	});
});
