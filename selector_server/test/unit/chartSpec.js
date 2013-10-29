'use strict';

/**
 * Tests for the chart directive.
 */

describe('Chart directive', function(){
	var html, scope, elem, compiled, chartElem;
	
	beforeEach(function() {
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
					}
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
	
	it('should contain an <svg> element', function() {
		expect(chartElem.children().prop('tagName')).toBe('svg');
	});
	
	it('should only ever have one <svg> element', function() {
		scope.chartData.lines = [
		{
			'name': 'New line',
			'isDiscrete': true,
			'data': [[1,1],[2,2]],
			'color': 'red'
		}];
		scope.$digest();
		expect(chartElem.children().size()).toBe(1);
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
	
	it('should be able to display a single extra point', function() {
		// Remove the line
		scope.chartData.lines = null;
		// Add an extra point
		scope.chartData.extraPoints = [
			{
				x: 1,
				y: 1,
				color: 'blue',
				width: '2px',
				radius: '4px'
			}
		];
		scope.$digest();
		
		var dot = chartElem.find('circle.dot');
		expect(dot.attr('r')).toBe('4px');
		expect(dot.attr('stroke')).toBe('blue');
		expect(dot.attr('stroke-width')).toBe('2px');
	});
	
	it('should be able to handle points with non-positive values in linear mode', function() {
		scope.chartData.xScale = 'linear';
		scope.chartData.yScale = 'linear';
		scope.chartData.lines.push(
		{
			'name': 'Test line',
			'isDiscrete': true,
			'data': [[-1,-1],[0,0],[1,1]],
			'color': 'red',
			'width': '1.5px',
			'dasharray': '10,10'
		});
		scope.$digest();
		// Make sure there are no NaNs or Infinities in the path specifiers.
		expect(chartElem.find("[d*='NaN']").size()).toBe(0);
		expect(chartElem.find("[d*='Infinity']").size()).toBe(0);
	});
	
	it('should gracefully convert non-positive values in log mode', function() {
		scope.chartData.xScale = 'log';
		scope.chartData.yScale = 'log';
		scope.chartData.lines.push(
		{
			'name': 'Test line',
			'isDiscrete': true,
			'data': [[-1,-1],[0,0],[1,1]],
			'color': 'red',
			'width': '1.5px',
			'dasharray': '10,10'
		});
		scope.$digest();
		// Make sure there are no NaNs or Infinities in the path specifiers.
		expect(chartElem.find("[d*='NaN']").size()).toBe(0);
		expect(chartElem.find("[d*='Infinity']").size()).toBe(0);
	});
	
	it('should handle optional legend entries', function() {
		scope.chartData.lines = [
		{
			'name': 'Legend-less line',
			'isDiscrete': true,
			'data': [[1,1],[2,2]],
			'color': 'red',
			'showLegend': false
		}];
		scope.$digest();
		var legendEntry = chartElem.find('text.legend.name');
		expect(legendEntry.size()).toBe(0);
	});
	
	it('should be able to automatically draw circles on lines', function() {
		scope.chartData.lines[0].drawCircles = true;
		scope.$digest();
		var dots = chartElem.find('circle.dot');
		expect(dots.first().attr('stroke')).toBe('red');
		expect(dots.first().attr('stroke-width')).toBe('1.5px');
	});
	
	it('should be able to generate lines from functions', function() {
		scope.chartData.lines[0] = {
			'name': 'Function line',
			'isDiscrete': false,
			'func': function(x) {
				return x*x;
			},
			'limits': {
				xmin: 0,
				xmax: 10,
				ymin: 0,
				ymax: 10
			},
			'color': 'green'
		};
		scope.$digest();
		
		// Check that the line has been created
		var line = chartElem.find('path.line');
		expect(line.size()).toBe(1);
		expect(line.attr('stroke')).toBe('green');
	});
});
