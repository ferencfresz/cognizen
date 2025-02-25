/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview Replaces widgets with charts using Chart.js.
 *
 * This file should be included on websites as CKEditor returns just a div element with data attributes that needs to be replaced with a proper chart.
 * The "Preview" plugin is using this file automatically.
 */

// For IE8 and below the code will not be executed.
if ( typeof document.addEventListener !== 'undefined' )
	document.addEventListener( 'DOMContentLoaded', function() {
	// Make sure Chart.js is enabled on a page.
	if ( typeof Chart === 'undefined' ) {
		if ( typeof console !== "undefined" ) {
			console.log( 'ERROR: You must include chart.min.js on this page in order to use Chart.js' );
		}
		return;
	}

	// Loop over all found elements.
	[].forEach.call( document.querySelectorAll('div.chartjs'), function ( el ) {
			var colors;

			// Color sets defined on a website.
			if ( typeof chartjs_colors !== 'undefined' ) {
				colors = chartjs_colors;
			}
			// Color sets provided by contentPreview event handler.
			else if ( typeof chartjs_colors_json !== 'undefined' ) {
				colors = JSON.parse( chartjs_colors_json );
			}
			// Default hardcoded values used if file is included on a website that did not set "chartjs_colors" variable.
			else {
				colors = {
					// Colors for Bar chart: http://www.chartjs.org/docs/#bar-chart-data-structure
					fillColor: "rgba(151,187,205,0.5)",
					strokeColor: "rgba(151,187,205,0.8)",
					highlightFill: "rgba(151,187,205,0.75)",
					highlightStroke: "rgba(151,187,205,1)",
					// Colors for Pie/Doughnut charts: http://www.chartjs.org/docs/#doughnut-pie-chart-data-structure
					data: ['#B33131', '#B66F2D', '#B6B330', '#71B232', '#33B22D', '#31B272', '#2DB5B5', '#3172B6', '#3232B6', '#6E31B2', '#B434AF', '#B53071']
				};
			}

			// Get chart information from data attributes.
			var chartType = el.getAttribute( 'data-chart' ),
				values = JSON.parse( el.getAttribute( 'data-chart-value' ) );

			// Malformed element, exit.
			if ( !values || !values.length || !chartType )
				return;

			// <div> may contain some text like "chart" or &nbsp which is there just to prevent <div>s from being deleted.
			el.innerHTML = '';

			// Prepare some DOM elements for Chart.js.
			var canvas = document.createElement( 'canvas' );
			canvas.height = 150;
			el.appendChild( canvas );

			var legend = document.createElement( 'div' );
			legend.setAttribute( 'class', 'chartjs-legend' );
			el.appendChild( legend );

			// The code below is the same as in plugin.js.
			// ########## RENDER CHART START ##########
			// Prepare canvas and chart instance.
			var i, ctx = canvas.getContext( "2d" ),
				chart = new Chart( ctx );

			// Set some extra required colors by Pie/Doughnut charts.
			// Ugly charts will be drawn if colors are not provided for each data.
			// http://www.chartjs.org/docs/#doughnut-pie-chart-data-structure
			if ( chartType != 'bar' ) {
				for ( i = 0; i < values.length; i++ ) {
					values[i].color = colors.data[i];
					values[i].highlight = colors.data[i];
				}
			}

			// Render Bar chart.
			if ( chartType == 'bar' ) {
				var data = {
					// Chart.js supports multiple datasets.
					// http://www.chartjs.org/docs/#bar-chart-data-structure
					// This plugin is simple, so it supports just one.
					// Need more features? Create a Pull Request :-)
					datasets : [
						{
							label: "",
							fillColor: colors.fillColor,
							strokeColor: colors.strokeColor,
							highlightFill: colors.highlightFill,
							highlightStroke: colors.highlightStroke,
							data : []
						}],
					labels : []
				};
				// Bar charts accept different data format than Pie/Doughnut.
				// We need to pass values inside datasets[0].data.
				for ( i = 0; i < values.length; i++ ) {
					if ( values[i].value ) {
						data.labels.push( values[i].label );
						data.datasets[0].data.push( values[i].value );
					}
				}
				chart.Bar( data );
				// For "Bar" type legend makes sense only with more than one dataset.
				legend.innerHTML = '';
			}
			// Render Pie chart and legend.
			else if ( chartType == 'pie' ) {
				legend.innerHTML = chart.Pie( values, {
					animateRotate: false
				} ).generateLegend();
			}
			// Render Doughnut chart and legend.
			else {
				legend.innerHTML = chart.Doughnut( values, {
					animateRotate: false
				} ).generateLegend();
			}
			// ########## RENDER CHART END ##########
		}
	);
});