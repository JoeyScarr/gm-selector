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
			expect(util.interp_array(list, -0.1)).toBeNull();
			expect(util.interp_array(list, 0)).toEqual(0);
			expect(util.interp_array(list, 0.5)).toEqual(5);
			expect(util.interp_array(list, 1)).toEqual(10);
			expect(util.interp_array(list, 1.1)).toBeNull();
		}));
		it('should correctly interpolate in a list with duplicates', inject(function(util) {
			var list = [[0,0], [1,10], [1,10], [1,10], [2,11]];
			expect(util.interp_array(list, -0.1)).toBeNull();
			expect(util.interp_array(list, 0)).toEqual(0);
			expect(util.interp_array(list, 0.5)).toEqual(5);
			expect(util.interp_array(list, 1)).toEqual(10);
			expect(util.interp_array(list, 1.1)).toEqual(10.1);
			expect(util.interp_array(list, 2)).toEqual(11);
			expect(util.interp_array(list, 2.1)).toBeNull();
		}));
	});
	
	describe('defaultFor', function() {
		it('should return given values when appropriate', inject(function(util) {
			expect(util.defaultFor(0, 1)).toEqual(0);
			expect(util.defaultFor(10, 1)).toEqual(10);
			expect(util.defaultFor('test', 1)).toEqual('test');
			expect(util.defaultFor(null, 1)).toBeNull();
			expect(util.defaultFor(false, 1)).toEqual(false);
		}));
		it('should return default values when appropriate', inject(function(util) {
			expect(util.defaultFor(undefined, 1)).toEqual(1);
			expect(util.defaultFor(undefined, 'test')).toEqual('test');
			expect(util.defaultFor(undefined, undefined)).toBeUndefined();
			expect(util.defaultFor(undefined, true)).toEqual(true);
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
			expect(util.median([])).toBeNull();
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
			expect(util.sample(0, 0).length).toEqual(0);
			expect(util.sample(10, 0).length).toEqual(0);
			expect(util.sample(10, 1).length).toEqual(1);
			expect(util.sample(53, 53).length).toEqual(53);
			expect(util.sample(100, 53).length).toEqual(53);
		}));
		it('should return all items when k > n', inject(function(util) {
			expect(util.sample(0, 0).length).toEqual(0);
			expect(util.sample(0, 10).length).toEqual(0);
			expect(util.sample(1, 10)).toEqual([0]);
			expect(util.sample(2, 10).length).toEqual(2);
			expect(util.sample(6, 10).length).toEqual(6);
			expect(util.sample(53, 100).length).toEqual(53);
		}));
	});
	
	describe('ks_critical_value', function() {
		it('should return correct exact values', inject(function(util) {
			expect(util.ks_critical_value(1,0.01)).toEqual(0.995);
			expect(util.ks_critical_value(10,0.05)).toEqual(0.40925);
			expect(util.ks_critical_value(20,0.2)).toEqual(0.23156);
		}));
		it('should return correct interpolated values', inject(function(util) {
			expect(util.ks_critical_value(1,0.015)).toEqual(0.9925);
			expect(util.ks_critical_value(10,0.075)).toEqual((0.40925+0.36866)/2);
			expect(util.ks_critical_value(20,0.15)).toEqual((0.26473+0.23156)/2);
		}));
		it('should return null with incorrect parameters', inject(function(util) {
			expect(util.ks_critical_value(0,0.015)).toBeNull();
			expect(util.ks_critical_value(10,0.001)).toBeNull();
		}));
		it('should use Miller approximation correctly', inject(function(util) {
			var alpha = 0.05;
			var n = 30;
			var alpha1 = alpha / 2;
			var A = 0.09037 * Math.pow(-Math.log(alpha1)/Math.log(10), 1.5) +
							0.01515 * Math.pow(Math.log(alpha1)/Math.log(10), 2) - 0.08467 * alpha1 - 0.11143;
			var asymptoticStat = Math.sqrt(-0.5 * Math.log(alpha1) / n);
			var criticalValue = asymptoticStat - 0.16693 / n - A / Math.pow(n, 1.5);
			expect(util.ks_critical_value(n,alpha)).toEqual(criticalValue);
		}));
	});
	
	describe('build_cdf', function() {
		it('should correctly build a small CDF', inject(function(util) {
			expect(util.build_cdf([1,2])).toEqual([[1,0], [1,0.5], [2,0.5], [2,1]]);
		}));
	});
});
