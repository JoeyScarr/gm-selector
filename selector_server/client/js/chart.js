"use strict";

// Declares the chart module, which draws charts.
var MOD_chart = angular.module('chart', []);

// Create a directive for building charts.
MOD_chart.directive('chart', ['util', function (util) {
	// Constants
	var SCALE_LINEAR = 'linear';
	var SCALE_LOG = 'log';
	var SCALE_POWER = 'pow';

	return {
		restrict: 'E',
		replace: true,
		scope: {
			data: '=',
			id: '='
		},
		compile: function compile(element, attrs) {
			
			var width = attrs.width || '100%';
			var height = attrs.height || '620px';
			var htmlText = '<div style="position:relative;display:inline-block;width:' + width + ';height:' + height + '"></div>'
			element.replaceWith(htmlText);
			
			return function link(scope, element, attrs) {
				var id = scope.id || 'mychart';
				element[0].id = scope.id;
				scope.$watch('data', function (newVal, oldVal) {
					$('#' + id).empty();
					
					if (!!newVal && !!newVal.lines && newVal.lines.length > 0) {
						var lines = newVal.lines;
						var extraPoints = newVal.extraPoints;
						
						// Convert function-based lines into discrete lines.
						for (var i = 0; i < lines.length; ++i) {
							var line = lines[i];
							if (!line.isDiscrete) {
								var x_lowerlimit = line.limits.xmin;
								var x_upperlimit = line.limits.xmax;
								var points = d3.range(x_lowerlimit, x_upperlimit, (x_upperlimit - x_lowerlimit)/500.0)
									.map(function(x) {
										return [x, val.func(x)];
									});
								line.data = points;
							}
						}
						
						// Calculate limits.
						var xmin = Number.MAX_VALUE;
						var xmax = -Number.MAX_VALUE;
						var ymin = Number.MAX_VALUE;
						var ymax = -Number.MAX_VALUE;
						for (var i = 0; i < lines.length; ++i) {
							var line = lines[i];
							if (line.isDiscrete) {
								// Assume for simplicity that the function is monotonic.
								// Check the first point in the data set.
								xmin = Math.min(xmin, line.data[0][0]);
								ymin = Math.min(ymin, line.data[0][1]);
								xmax = Math.max(xmax, line.data[0][0]);
								ymax = Math.max(ymax, line.data[0][1]);
								// Check the last point in the data set.
								var last = line.data.length - 1;
								xmin = Math.min(xmin, line.data[last][0]);
								ymin = Math.min(ymin, line.data[last][1]);
								xmax = Math.max(xmax, line.data[last][0]);
								ymax = Math.max(ymax, line.data[last][1]);
							} else {
								xmin = Math.min(xmin, line.limits.xmin);
								ymin = Math.min(ymin, line.limits.ymin);
								xmax = Math.max(xmax, line.limits.xmax);
								ymax = Math.max(ymax, line.limits.ymax);
							}
						}
						
						var scaleX = newVal.xScale || newVal.scale || SCALE_LINEAR;
						var scaleY = newVal.yScale || newVal.scale || SCALE_LINEAR;
						
						var argsMap = {
							containerId: id,
							limits: {
								xmin: xmin,
								xmax: xmax,
								ymin: ymin,
								ymax: ymax
							},
							lines: lines,
							extraPoints: extraPoints,
							scaleX: scaleX,
							scaleY: scaleY,
							xAxisLabel: newVal.xAxisLabel,
							yAxisLabel: newVal.yAxisLabel,
							showXAxisScaleButtons: newVal.showXAxisScaleButtons,
							showYAxisScaleButtons: newVal.showYAxisScaleButtons
						};
						LineGraph(argsMap);
					}
				},true);
				
				/**
				 * Create and draw a new line-graph.
				 * 
				 * Arguments:
				 *	 containerId => id of container to insert SVG into [REQUIRED]
				 *	 marginTop => Number of pixels for top margin. [OPTIONAL => Default: 20]
				 *	 marginRight => Number of pixels for right margin. [OPTIONAL => Default: 20]
				 *	 marginBottom => Number of pixels for bottom margin. [OPTIONAL => Default: 35]
				 *	 marginLeft => Number of pixels for left margin. [OPTIONAL => Default: 90]
				 *	 data => a dictionary containing the following keys [REQUIRED]
				 *		 values => The data array of arrays to graph. [REQUIRED]
				 *		 start => The start time in milliseconds since epoch of the data. [REQUIRED]
				 *		 end => The end time in milliseconds since epoch of the data. [REQUIRED]
				 *		 step => The time in milliseconds between each data value.	 [REQUIRED]	
				 *		 names => The metric name for each array of data. [REQUIRED]
				 *		 displayNames => Display name for each metric. [OPTIONAL => Default: same as 'names' argument]
				 *				Example: ['MetricA', 'MetricB'] 
				 *		 colors => What color to use for each metric. [OPTIONAL => Default: black]
				 *				Example: ['blue', 'red'] to display first metric in blue and second in red.
				 *		 scale => What scale to display the graph with. [OPTIONAL => Default: linear]
				 *				Possible Values: linear, pow, log
				 *		 rounding => How many decimal points to round each metric to. [OPTIONAL => Default: Numbers are rounded to whole numbers (0 decimals)]
				 *				Example: [2, 1] to display first metric with 2 decimals and second metric with 1. 
				 *		 numAxisLabelsPowerScale => Hint for how many labels should be displayed for the Y-axis in Power scale. [OPTIONAL => Default: 6]
				 *		 numAxisLabelsLinearScale  => Hint for how many labels should be displayed for the Y-axis in Linear scale. [OPTIONAL => Default: 6]
				 *
				 * Events (fired from container):
				 *	 LineGraph:dataModification => whenever data is changed
				 *	 LineGraph:configModification => whenever config is changed
				 */
				function LineGraph(argsMap) {
					/* *************************************************************** */
					/* public methods */
					/* *************************************************************** */
					var self = this;
					
					/* *************************************************************** */
					/* private variables */
					/* *************************************************************** */
					// the div we insert the graph into
					var containerId = argsMap.containerId;
					var container = document.querySelector('#' + containerId);
					
					// functions we use to display and interact with the graphs and lines
					var graph, x, yLeft, xAxis, yAxisLeft, yAxisLeftDomainStart;
					
					// SVG elements
					var svgLinesGroup, svgLinesGroupDiscrete, svgExtraPoints, svgExtraPointsGroup, svgLinesGroupText, svgLines;
					
					var lineFunction, lineFunctionSeriesIndex = -1;
					
					var scales = [[SCALE_LINEAR,'Linear'], [SCALE_LOG,'Log']];
					// Default scales
					var yScale = argsMap.scaleY;
					var xScale = argsMap.scaleX;
					
					// Axis labels
					var xAxisLabel = util.defaultFor(argsMap.xAxisLabel, 'X Axis');
					var yAxisLabel = util.defaultFor(argsMap.yAxisLabel, 'Y Axis');
					var numAxisLabelsLinearScale = util.defaultFor(argsMap.numAxisLabelsLinearScale, 6);
					var numAxisLabelsLogScale = util.defaultFor(argsMap.numAxisLabelsLogScale, 5);
					var numAxisLabelsPowerScale = util.defaultFor(argsMap.numAxisLabelsPowerScale, 6);
					var showXAxisScaleButtons = util.defaultFor(argsMap.showXAxisScaleButtons, true);
					var showYAxisScaleButtons = util.defaultFor(argsMap.showYAxisScaleButtons, true);
					
					// Data
					var lines = argsMap.lines;
					var extraPoints = util.defaultFor(argsMap.extraPoints, []);
					// Set up legend entries for those lines that display them.
					var legendEntries = $.map(lines, function(val, i) {
						if (val.showLegend == null || val.showLegend) {
							return {
								name: val.name || "Line " + (i + 1),
								color: val.color || "red"
							};
						} else {
							return null;
						}
					});
					
					var hoverContainer, hoverLine, hoverLineXOffset, hoverLineYOffset, hoverLineGroup;
					var legendFontSize = 12; // we can resize dynamically to make fit so we remember it here
					
					// define dimensions of graph
					var marginTop = 15, marginRight = 20, marginBottom = 35, marginLeft = 70;
					var w, h;	 // width & height
					
					var transitionDuration = 300;
					
					var tickFormatForLogScale = function(d) { return d3.format(",.1e")(d) };
					
					// used to track if the user is interacting via mouse/finger instead of trying to determine
					// by analyzing various element class names to see if they are visible or not
					var userCurrentlyInteracting = false;
					var currentUserPositionX = -1;
						
					/* *************************************************************** */
					/* initialization */
					/* *************************************************************** */
					var _init = function() {
						initDimensions();
						
						createGraph();
						
						// window resize listener
						// de-dupe logic from http://stackoverflow.com/questions/667426/javascript-resize-event-firing-multiple-times-while-dragging-the-resize-handle/668185#668185
						var TO = false;
						$(window).resize(function(){
							if(TO !== false)
								clearTimeout(TO);
							TO = setTimeout(handleWindowResizeEvent, 200); // time in miliseconds
						});
					};
					
					/* *************************************************************** */
					/* private methods */
					/* *************************************************************** */
					
					var redrawAxes = function(withTransition) {
						initY();
						initX();
						
						if(withTransition) {
							// slide x-axis to updated location
							graph.selectAll("g .x.axis").transition()
							.duration(transitionDuration)
							.ease("linear")
							.call(xAxis)				  
						
							// slide y-axis to updated location
							graph.selectAll("g .y.axis.left").transition()
							.duration(transitionDuration)
							.ease("linear")
							.call(yAxisLeft)
						} else {
							// slide x-axis to updated location
							graph.selectAll("g .x.axis")
							.call(xAxis)				  
						
							// slide y-axis to updated location
							graph.selectAll("g .y.axis.left")
							.call(yAxisLeft)
						}
					};
					
					var redrawLines = function(withTransition) {
						// redraw lines
						if(withTransition) {
							graph.selectAll("g .lines path")
							.transition()
								.duration(transitionDuration)
								.ease("linear")
								.attr("d", function(d, i) {
									return lineFunction(d.data);
								})
								.attr("transform", null);
								
							graph.selectAll("g .lines .dot")
								.transition()
									.duration(transitionDuration)
									.ease("linear")
									.attr("cx", function(d) {
										return x(d[0]);
									})
									.attr("cy", function(d) {
										return yLeft(d[1]);
									})
									.attr("transform", null);
						} else {
							graph.selectAll("g .lines path")
								.attr("d", function(d, i) {
									return lineFunction(d.data);
								})
								.attr("transform", null);
								
							graph.selectAll("g .lines .dot")
								.attr("cx", function(d) {
									return x(d[0]);
								})
								.attr("cy", function(d) {
									return yLeft(d[1]);
								})
								.attr("transform", null);
						}
					};
					
					/*
					 * Allow re-initializing the y function at any time.
					 *  - it will properly determine what scale is being used based on last user choice (via public switchScale methods)
					 */
					var initY = function() {
						var maxYscaleLeft = calculateMaxY();
						var numAxisLabels;
						if(yScale == SCALE_POWER) {
							yLeft = d3.scale.pow().exponent(0.3).domain([0, maxYscaleLeft]).range([h, 0]).nice();	
							numAxisLabels = numAxisLabelsPowerScale;
						} else if(yScale == SCALE_LOG) {
							// we can't have 0 so will represent 0 with a very small number
							// 0.1 works to represent 0, 0.01 breaks the tickFormatter
							yLeft = d3.scale.log().domain([Math.max(calculateMinY(),0.00001), maxYscaleLeft]).range([h, 0]).nice();	
							numAxisLabels = numAxisLabelsLogScale;
						} else if(yScale == SCALE_LINEAR) {
							yLeft = d3.scale.linear().domain([0, maxYscaleLeft]).range([h, 0]).nice();
							numAxisLabels = numAxisLabelsLinearScale;
						}
	
						yAxisLeft = d3.svg.axis().scale(yLeft).ticks(numAxisLabels, tickFormatForLogScale).orient("left").tickSize(-w,0,0);
					};
					
					/**
					 * Allow re-initializing the x function at any time.
					 */
					var initX = function() {
						var numAxisLabels;
						if(xScale == SCALE_POWER) {
							x = d3.scale.pow().exponent(0.3).domain([calculateMinX(), calculateMaxX()]).range([0, w]).nice();	
							numAxisLabels = numAxisLabelsPowerScale;
						} else if(xScale == SCALE_LOG) {
							x = d3.scale.log().domain([calculateMinX(), calculateMaxX()]).range([0, w]);//.nice();	
							numAxisLabels = numAxisLabelsLogScale;
						} else if(xScale == SCALE_LINEAR) {
							x = d3.scale.linear().domain([calculateMinX(), calculateMaxX()]).range([0, w]).nice();
							numAxisLabels = numAxisLabelsLinearScale;
						}
						xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(numAxisLabels, tickFormatForLogScale).tickSize(-h,0,0).tickSubdivide(0);
					};
	
					/*
					 * Whenever we add/update data we want to re-calculate if scales have changed
					 */
					var calculateMinX = function() {
						return argsMap.limits.xmin;
					};
					var calculateMaxX = function() {
						return argsMap.limits.xmax;
					};
					var calculateMinY = function() {
						return argsMap.limits.ymin;
					};
					var calculateMaxY = function() {
						return argsMap.limits.ymax;
					};
					
					/**
					* Creates the SVG elements and displays the line graph.
					*
					* Expects to be called once during instance initialization.
					*/
					var createGraph = function() {
						
						// Add an SVG element with the desired dimensions and margin.
						graph = d3.select("#" + containerId).append("svg:svg")
								.attr("class", "line-graph")
								.attr("width", w + marginLeft + marginRight)
								.attr("height", h + marginTop + marginBottom)
								.append("svg:g")
								.attr("transform", "translate(" + marginLeft + "," + marginTop + ")");
						
						initX();
						
						// Add the x-axis.
						graph.append("svg:g")
							.attr("class", "x axis")
							.attr("transform", "translate(0," + h + ")")
							.call(xAxis);
							
						
						// y is all done in initY because we need to re-assign vars quite often to change scales
						initY();
								
						// Add the y-axis to the left
						graph.append("svg:g")
							.attr("class", "y axis left")
							.attr("transform", "translate(0,0)")
							.call(yAxisLeft);
						
						// create line function used to plot our data
						lineFunction = d3.svg.line()
							.x(function(d,i) { 
								return x(d[0]);
							})
							.y(function(d, i) {
								return yLeft(d[1]);
							});
						
						// add a group of points to display extra point data
						svgExtraPoints = graph.append("svg:g")
							.attr("class", "lines")
							.selectAll(".dot")
							.data(extraPoints) // bind the array of arrays
						
						svgExtraPointsGroup = svgExtraPoints.enter().append("g")
							.filter(function(d, i) {
								return !!data.extraPoints[i];
							})
							.attr("class", function(d, i) {
								return "line_group series_" + i;
							});
						
						// add the extra data points
						lineFunctionSeriesIndex = -1;
						svgExtraPointsGroup.selectAll(".dot")
							.data(function(d, i) {
								return d;
							})
							.enter().append("svg:circle")
							.attr("class", "dot")
							.attr("r", 3.5)
							.attr("cx", function(d) {
								return x(d[0]);
							})
							.attr("cy", function(d) {
								return yLeft(d[1]);
							})
							.attr("fill", "transparent")
							.attr("stroke", function(d, i) {
								if (i == 0) {
									lineFunctionSeriesIndex++;
								}
								return d.color || "gray";//data.colors[lineFunctionSeriesIndex];
							});
	
						// append a group to contain all lines
						svgLines = graph.append("svg:g")
							.attr("class", "lines")
							.selectAll("path")
							.data(lines); // bind the array of arrays
	
						// persist this reference so we don't do the selector every mouse event
						hoverContainer = container.querySelector('g .lines');
						
						$(container).mouseleave(function(event) {
							handleMouseOutGraph(event);
						})
						
						$(container).mousemove(function(event) {
							handleMouseOverGraph(event);
						})		
	
									
						// add a line group for each array of values (it will iterate the array of arrays bound to the data function above)
						svgLinesGroup = svgLines.enter().append("g")
								.attr("class", function(d, i) {
									return "line_group series_" + i;
								});
								
						// add path (the actual line) to line group
						svgLinesGroup.append("path")
								.attr("class", function(d, i) {
									return "line series_" + i;
								})
								.attr("fill", "none")
								.attr("stroke", function(d, i) {
									return d.color || "red";
								})
								.attr("d", function(d, i) {
									return lineFunction(d.data); // use the 'lineFunction' to create the data points in the correct x,y axis
								})
								.on('mouseover', function(d, i) {
									handleMouseOverLine(d, i);
								});
						
						// add a group of points for discrete line groups
						var discreteColors = [];
						svgLinesGroupDiscrete = svgLines.enter().append("g")
							.filter(function(d, i) {
								if (!!d.drawCircles) {
									discreteColors.push(d.color || "red");
								}
								return !!d.drawCircles;
							})
							.attr("class", function(d, i) {
								return "line_group series_" + i;
							});
						
						// add data points to the line group (if dataset is discrete)
						lineFunctionSeriesIndex = -1;
						svgLinesGroupDiscrete.selectAll(".dot")
							.data(function(d, i) {
								return d;
							})
							.enter().append("svg:circle")
							.attr("class", "dot")
							.attr("r", 3.5)
							.attr("cx", function(d) {
								return x(d[0]);
							})
							.attr("cy", function(d) {
								return yLeft(d[1]);
							})
							.attr("fill", "transparent")
							.attr("stroke", function(d, i) {
								if (i == 0) {
									lineFunctionSeriesIndex++;
								}
								return discreteColors[lineFunctionSeriesIndex];
							});
							
						// add line label to line group
						svgLinesGroupText = svgLinesGroup.filter(function(d, i) {
								return d.showLegend;
							})
							.append("svg:text");
						svgLinesGroupText.attr("class", function(d, i) {
								return "line_label series_" + i;
							})
							.text(function(d, i) {
									return "";
								});
						
						
						// add a 'hover' line that we'll show as a user moves their mouse (or finger)
						// so we can use it to show detailed values of each line
						hoverLineGroup = graph.append("svg:g")
											.attr("class", "hover-line");
						// add the line to the group
						hoverLine = hoverLineGroup
							.append("svg:line")
								.attr("x1", 0).attr("x2", 0) // vertical line so same value on each
								.attr("y1", 0).attr("y2", h) // top to bottom	
								.attr("stroke","#6E7B8B")
								.attr("fill","none");
						// hide it by default
						hoverLine.classed("hide", true);
						
						createXScaleButtons();
						createYScaleButtons();
						createDateLabel();
						createLegend();
						createXAxisLabel();
						createYAxisLabel();
						setValueLabelsToLatest();
					}
					
					var createXAxisLabel = function() {
						var xAxisTitle = graph.append("svg:text")
							.text(xAxisLabel)
							.attr("style", "text-anchor:middle")
							.attr("font-weight", "bold")
							.attr("x", w/2)
							.attr("y", h+30);
					};
					
					var createYAxisLabel = function() {
						var yAxisTitle = graph.append("svg:text")
							.text(yAxisLabel)
							.attr("style", "text-anchor:middle")
							.attr("transform", "rotate(270)")
							.attr("font-weight", "bold")
							.attr("x", -h/2)
							.attr("y", -45);
					};
					
					/**
					 * Create a legend that displays the name of each line with appropriate color coding
					 * and allows for showing the current value when doing a mouseOver
					 */
					var createLegend = function() {
						
						// append a group to contain all lines
						var legendLabelGroup = graph.append("svg:g")
								.attr("class", "legend-group")
							.selectAll("g")
								.data(legendEntries)
							.enter().append("g")
								.attr("class", "legend-labels");
								
						legendLabelGroup.append("svg:text")
								.attr("class", "legend name")
								.text(function(d, i) {
									return d.name;
								})
								.attr("font-size", legendFontSize)
								.attr("style", "text-anchor:end")
								.attr("fill", function(d, i) {
									// return the color for this row
									return d.color;
								})
								.attr("y", function(d, i) {
									return 20+i*20;
								})
	
								
						// put in placeholders with 0 width that we'll populate and resize dynamically
						legendLabelGroup.append("svg:text")
								.attr("class", "legend value")
								.attr("font-size", legendFontSize)
								.attr("fill", function(d, i) {
									return d.color;
								})
								.attr("y", function(d, i) {
									return 20+i*20;
								})		
						
						var cumulativeWidth = 0;
						var labelNameEnd = [];
						graph.selectAll("text.legend.name")
								.attr("x", function(d, i) {
									return $("#" + containerId).width()-240;
								})
					}
					
					/**
					 * Create scale buttons for switching the x-axis
					 */
					var createXScaleButtons = function() {
						if (showXAxisScaleButtons) {
							var cumulativeWidth = $("#" + containerId).width()-230;
							// Create the label
							var label = graph.append("svg:text")
								.attr("font-size", "12")
								.attr("font-weight", "bold")
								.text("X-axis Scale:")
								.attr("y", h+28)
								.attr("x", cumulativeWidth);
							cumulativeWidth += 80;
							// Create the buttons
							var buttonGroup = graph.append("svg:g")
								.attr("class", "x-scale-button-group")
								.selectAll("g")
								.data(scales)
								.enter()
								.append("svg:text")
									.attr("class", "x-scale-button")
									.text(function(d, i) {
										return d[1];
									})
									.attr("font-size", "12") // this must be before "x" which dynamically determines width
									.attr("fill", function(d) {
										if(d[0] == xScale) {
											return "black";
										} else {
											return "blue";
										}
									})
									.classed("selected", function(d) {
										if(d[0] == xScale) {
											return true;
										} else {
											return false;
										}
									})
									.attr("x", function(d, i) {
										// return it at the width of previous labels (where the last one ends)
										var returnX = cumulativeWidth;
										// increment cumulative to include this one
										cumulativeWidth += 40;
										return returnX;
									})
									.attr("y", h+28)
									.on('click', function(d, i) {
										handleMouseClickXScaleButton(this, d, i);
									});
						}
					}
	
					var handleMouseClickXScaleButton = function(button, buttonData, index) {
						xScale = buttonData[0];
						redrawAxes(true);
						redrawLines(true);
						
						// change text decoration
						graph.selectAll('.x-scale-button')
						.attr("fill", function(d) {
							if(d[0] == xScale) {
								return "black";
							} else {
								return "blue";
							}
						})
						.classed("selected", function(d) {
							if(d[0] == xScale) {
								return true;
							} else {
								return false;
							}
						})
						
					}
					
					
					
					/**
					 * Create scale buttons for switching the y-axis
					 */
					var createYScaleButtons = function() {
						if (showYAxisScaleButtons) {
							var cumulativeWidth = 80;
							// Create the label
							var label = graph.append("svg:text")
								.attr("font-size", "12")
								.attr("font-weight", "bold")
								.text("Y-axis Scale:")
								.attr("y", -4)
								.attr("x", 0);
							// Create the buttons
							var buttonGroup = graph.append("svg:g")
								.attr("class", "scale-button-group")
								.selectAll("g")
								.data(scales)
								.enter()
								.append("svg:text")
									.attr("class", "scale-button")
									.text(function(d, i) {
										return d[1];
									})
									.attr("font-size", "12") // this must be before "x" which dynamically determines width
									.attr("fill", function(d) {
										if(d[0] == yScale) {
											return "black";
										} else {
											return "blue";
										}
									})
									.classed("selected", function(d) {
										if(d[0] == yScale) {
											return true;
										} else {
											return false;
										}
									})
									.attr("x", function(d, i) {
										// return it at the width of previous labels (where the last one ends)
										var returnX = cumulativeWidth;
										// increment cumulative to include this one
										cumulativeWidth += 40;
										return returnX;
									})
									.attr("y", -4)
									.on('click', function(d, i) {
										handleMouseClickScaleButton(this, d, i);
									});
						}
					};
	
					var handleMouseClickScaleButton = function(button, buttonData, index) {
						yScale = buttonData[0];
						redrawAxes(true);
						redrawLines(true);
						
						// change text decoration
						graph.selectAll('.scale-button')
						.attr("fill", function(d) {
							if(d[0] == yScale) {
								return "black";
							} else {
								return "blue";
							}
						})
						.classed("selected", function(d) {
							if(d[0] == yScale) {
								return true;
							} else {
								return false;
							}
						})
					};
					
					/**
					 * Create a data label
					 */
					var createDateLabel = function() {
						var date = new Date(); // placeholder just so we can calculate a valid width
						// create the date label to the left of the scaleButtons group
						var buttonGroup = graph.append("svg:g")
							.attr("class", "date-label-group")
							.append("svg:text")
								.attr("class", "date-label")
								.attr("text-anchor", "end") // set at end so we can position at far right edge and add text from right to left
								.attr("font-size", "10") 
								.attr("y", -4)
								.attr("x", w)
								.text(date.toDateString() + " " + date.toLocaleTimeString())
					};
					
					/**
					 * Called when a user mouses over a line.
					 */
					var handleMouseOverLine = function(lineData, index) {
						// user is interacting
						userCurrentlyInteracting = true;
					}
	
					/**
					 * Called when a user mouses over the graph.
					 */
					var handleMouseOverGraph = function(event) {	
						var mouseX = event.pageX-hoverLineXOffset;
						var mouseY = event.pageY-hoverLineYOffset;
						
						if(mouseX >= 0 && mouseX <= w && mouseY >= 0 && mouseY <= h) {
							//show the hover line
							hoverLine.classed("hide", false);
	
							//set position of hoverLine
							hoverLine.attr("x1", mouseX).attr("x2", mouseX)
							
							displayValueLabelsForPositionX(mouseX)
							
							//user is interacting
							userCurrentlyInteracting = true;
							currentUserPositionX = mouseX;
						} else {
							//proactively act as if we've left the area since we're out of the bounds we want
							handleMouseOutGraph(event)
						}
					}
					
					
					var handleMouseOutGraph = function(event) {	
						//hide the hover-line
						hoverLine.classed("hide", true);
						
						setValueLabelsToLatest();
						
						//user is no longer interacting
						userCurrentlyInteracting = false;
						currentUserPositionX = -1;
					}
					
					/*
					* Handler for when data is updated.
					*/
					var handleDataUpdate = function() {
						if(userCurrentlyInteracting) {
							// user is interacting, so let's update values to wherever the mouse/finger is on the updated data
							if(currentUserPositionX > -1) {
								displayValueLabelsForPositionX(currentUserPositionX)
							}
						} else {
							// the user is not interacting with the graph, so we'll update the labels to the latest
							setValueLabelsToLatest();
						}
					}
					
					/**
					* Display the data values at position X in the legend value labels.
					*/
					var displayValueLabelsForPositionX = function(xPosition, withTransition) {
						var animate = false;
						if(withTransition != undefined) {
							if(withTransition) {
								animate = true;
							}
						}
						var dateToShow;
						var labelValueWidths = [];
						graph.selectAll("text.legend.value")
						.text(function(d, i) {
							var valuesForX = getValueForPositionXFromData(xPosition, i);
							dateToShow = valuesForX.date;
							return valuesForX.value;
						})
						.attr("x", function(d, i) {
							labelValueWidths[i] = this.getComputedTextLength(); 
						})
	
						// position label values
						graph.selectAll("text.legend.value")
						.attr("x", function(d, i) {
							return $("#" + containerId).width()-230;	
						});
					}
					
					/**
					* Set the value labels to whatever the latest data point is.
					*/
					var setValueLabelsToLatest = function(withTransition) {
						displayValueLabelsForPositionX(w, withTransition);
					}
					
					/**
					* Convert back from an X position on the graph to a data value from the given array (one of the lines)
					* Return {value: value, date, date}
					*/
					var getValueForPositionXFromData = function(xPosition, dataSeriesIndex) {
						var d = lines[dataSeriesIndex].data;
						var xValue = x.invert(xPosition);
						var dlength = !!d ? d.length : 0;//_.size(d);
						
						if (xValue >= d[0][0] && xValue <= d[dlength-1][0]) {
							for (var m = 1; m < dlength; m++) {
								if (xValue < d[m][0]) {
									var temp = ((xValue - d[m-1][0])*(d[m][1] - d[m-1][1])/(d[m][0]-d[m-1][0])+d[m-1][1]);
									return {value: '('+xValue.toFixed(4)+','+temp.toFixed(4)+')', date: null};
								}
							}
						}
						return {value: "", date: null};
					}
	
					
					/**
					 * Called when the window is resized to redraw graph accordingly.
					 */
					var handleWindowResizeEvent = function() {
						initDimensions();
					}
	
					/**
					 * Set height/width dimensions based on container.
					 */
					var initDimensions = function() {
						w = parseInt(width) - marginLeft - marginRight; // width
						h = parseInt(height) - marginTop - marginBottom; // height
						hoverLineXOffset = marginLeft+$(container).offset().left;
						hoverLineYOffset = marginTop+$(container).offset().top;
					}
					
					/**
					* Return the value from argsMap for key or throw error if no value found
					*/	  
					var getRequiredVar = function(argsMap, key, message) {
						if(!argsMap[key]) {
							if(!message) {
								throw new Error(key + " is required")
							} else {
								throw new Error(message)
							}
						} else {
							return argsMap[key]
						}
					}
					
					/**
					* Return the value from argsMap for key or defaultValue if no value found
					*/
					var getOptionalVar = function(argsMap, key, defaultValue) {
						if(!argsMap[key]) {
							return defaultValue
						} else {
							return argsMap[key]
						}
					}
					
					var error = function(message) {
						console.log("ERROR: " + message)
					}
					
					_init();
				};
			};
		}
	};
}]);