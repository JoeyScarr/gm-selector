'use strict';

/**
 * Tests for the chart directive.
 */

describe('Chart directive', function(){
	var html, scope, elem, compiled, chartElem;
	
	beforeEach(function () {
		// Load the chart module.
		module('chart');
		// Set the view HTML.
		html = '<div id="container"><chart id="\'testchart\'" data="chartData" width="660px" height="400px"></chart></div>';
		
		inject(function($compile, $rootScope) {
			// Create a scope.
			scope = $rootScope.$new();
			
			// Set up the chartData.
			scope.chartData = {
				name: 'Test',
				xAxisLabel: 'Test X Axis',
				yAxisLabel: 'Test Y Axis',
				xScale: 'log',
				yScale: 'linear',
				lines: [
					{
						'name': 'Test line',
						'isDiscrete': true,
						'data': [[1,1],[2,2]],
						'color': 'red',
						'width': '1.5px',
						'dasharray': '10,10'
					},
				]
			};
			
			// Get the DOM element.
			elem = $(html);
			
			// Compile the element into a function to process the view.
			compiled = $compile(elem);
			
			// Run the compiled view.
			compiled(scope);
			
			// Call digest on the scope.
			scope.$digest();
			
			chartElem = elem.children();
		});
	});
	
	it('should set the chart ID correctly', function() {
		expect(chartElem.attr('id')).toBe('testchart');
	});
	
	it('should contain an SVG element', function() {
		expect(chartElem.children().prop('tagName')).toBe('svg');
	});
	
	it('should have the correct X and Y axes', function() {
		expect(chartElem.find('.x-axis-label').text()).toBe('Test X Axis');
		expect(chartElem.find('.y-axis-label').text()).toBe('Test Y Axis');
	});
	
	it('should display a single SVG path with the correct attributes', function() {
		var line = chartElem.find('path.line');
		expect(line.size()).toBe(1);
		expect(line.attr('stroke')).toBe('red');
		expect(line.attr('stroke-width')).toBe('1.5px');
		expect(line.attr('stroke-dasharray')).toBe('10,10');
	});
	
	it('should display a legend with a single entry', function() {
		var legendEntry = chartElem.find('text.legend.name');
		expect(legendEntry.size()).toBe(1);
		expect(legendEntry.text()).toBe('Test line');
	});
});
