/*global requirejs:true, require:true, define:true*/
/**
 * Модель карты
 */
define([
	'underscore', 'jquery', 'Browser', 'Utils', 'socket', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM', 'renderer',
	'm/User', 'm/storage',
	'highstock/highstock.src',
	'text!tpl/admin/conveyer.jade', 'css!style/admin/conveyer'
], function (_, $, Browser, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, renderer, User, storage, Highcharts, jade) {
	'use strict';

	Highcharts = Highcharts || window.Highcharts;
	Highcharts.theme = {
		colors: ["#DDDF0D", "#7798BF", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
			"#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
		chart: {
			backgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, 'rgb(96, 96, 96)'],
					[1, 'rgb(16, 16, 16)']
				]
			},
			borderWidth: 0,
			borderRadius: 0,
			plotBackgroundColor: null,
			plotShadow: false,
			plotBorderWidth: 0
		},
		title: {
			style: {
				color: '#FFF',
				font: '16px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		},
		subtitle: {
			style: {
				color: '#DDD',
				font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
			}
		},
		xAxis: {
			gridLineWidth: 0,
			lineColor: '#999',
			tickColor: '#999',
			labels: {
				style: {
					color: '#BBB'
				}
			},
			title: {
				style: {
					color: '#AAA',
					font: 'bold 12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
				}
			}
		},
		yAxis: {
			alternateGridColor: null,
			minorTickInterval: null,
			gridLineColor: 'rgba(255, 255, 255, .1)',
			lineWidth: 0,
			tickWidth: 0,
			labels: {
				style: {
					color: '#BBB'
				}
			},
			title: {
				style: {
					color: '#AAA',
					font: 'bold 12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
				}
			}
		},
		legend: {
			itemStyle: {
				color: '#CCC'
			},
			itemHoverStyle: {
				color: '#FFF'
			},
			itemHiddenStyle: {
				color: '#333'
			}
		},
		labels: {
			style: {
				color: '#CCC'
			}
		},
		tooltip: {
			backgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, 'rgba(96, 96, 96, .8)'],
					[1, 'rgba(16, 16, 16, .8)']
				]
			},
			borderWidth: 0,
			style: {
				color: '#FFF'
			}
		},


		plotOptions: {
			line: {
				dataLabels: {
					color: '#CCC'
				},
				marker: {
					lineColor: '#333'
				}
			},
			spline: {
				marker: {
					lineColor: '#333'
				}
			},
			scatter: {
				marker: {
					lineColor: '#333'
				}
			},
			candlestick: {
				lineColor: 'white'
			}
		},

		toolbar: {
			itemStyle: {
				color: '#CCC'
			}
		},

		navigation: {
			buttonOptions: {
				backgroundColor: {
					linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
					stops: [
						[0.4, '#606060'],
						[0.6, '#333333']
					]
				},
				borderColor: '#000000',
				symbolStroke: '#C0C0C0',
				hoverSymbolStroke: '#FFFFFF'
			}
		},

		exporting: {
			buttons: {
				exportButton: {
					symbolFill: '#55BE3B'
				},
				printButton: {
					symbolFill: '#7797BE'
				}
			}
		},

		// scroll charts
		rangeSelector: {
			buttonTheme: {
				fill: {
					linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
					stops: [
						[0.4, '#888'],
						[0.6, '#555']
					]
				},
				stroke: '#000000',
				style: {
					color: '#CCC'
				},
				states: {
					hover: {
						fill: {
							linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
							stops: [
								[0.4, '#BBB'],
								[0.6, '#888']
							]
						},
						stroke: '#000000',
						style: {
							color: 'white'
						}
					},
					select: {
						fill: {
							linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
							stops: [
								[0.1, '#000'],
								[0.3, '#333']
							]
						},
						stroke: '#000000',
						style: {
							color: 'yellow'
						}
					}
				}
			},
			inputStyle: {
				backgroundColor: '#333',
				color: 'silver'
			},
			labelStyle: {
				color: 'silver'
			}
		},

		navigator: {
			handles: {
				backgroundColor: '#666',
				borderColor: '#AAA'
			},
			outlineColor: '#CCC',
			maskFill: 'rgba(16, 16, 16, 0.5)',
			series: {
				color: '#7798BF',
				lineColor: '#A6C7ED'
			}
		},

		scrollbar: {
			barBackgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0.4, '#888'],
					[0.6, '#555']
				]
			},
			barBorderColor: '#CCC',
			buttonArrowColor: '#CCC',
			buttonBackgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0.4, '#888'],
					[0.6, '#555']
				]
			},
			buttonBorderColor: '#CCC',
			rifleColor: '#FFF',
			trackBackgroundColor: {
				linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
				stops: [
					[0, '#000'],
					[1, '#333']
				]
			},
			trackBorderColor: '#666'
		},

		// special colors for some of the demo examples
		legendBackgroundColor: 'rgba(48, 48, 48, 0.8)',
		legendBackgroundColorSolid: 'rgb(70, 70, 70)',
		dataLabelsColor: '#444',
		textColor: '#E0E0E0',
		maskColor: 'rgba(255,255,255,0.3)'
	};

	var $window = $(window),
		highchartsOptions = Highcharts.setOptions(Highcharts.theme);

	return Cliche.extend({
		jade: jade,
		options: {
			deferredWhenReady: null // Deffered wich will be resolved when map ready
		},
		create: function () {
			this.destroy = _.wrap(this.destroy, this.localDestroy);
			this.auth = globalVM.repository['m/auth'];

			this.conveyerLengthData = [];
			this.conveyerConvertData = [];
			this.conveyerLengthChart = null;
			this.conveyerConvertChart = null;

			this.clength = ko.observable(0);
			this.cmaxlength = ko.observable(0);
			this.converted = ko.observable(0);

			this.timeoutUpdate = null;

			this.chartsOptions = {
				yAxis: {
					min: 0
				},
				rangeSelector: {
					selected: 1,
					buttons: [
						{
							type: 'minute',
							count: 60,
							text: 'H'
						},
						{
							type: 'minute',
							count: 12 * 60,
							text: '12H'
						},
						{
							type: 'day',
							count: 1,
							text: 'D'
						},
						{
							type: 'week',
							count: 1,
							text: 'W'
						},
						{
							type: 'month',
							count: 1,
							text: 'M'
						},
						{
							type: 'month',
							count: 6,
							text: 'H-Y'
						},
						{
							type: 'ytd',
							text: 'YTD'
						},
						{
							type: 'year',
							count: 1,
							text: 'Year'
						},
						{
							type: 'all',
							text: 'All'
						}
					]
				}
			};

			ko.applyBindings(globalVM, this.$dom[0]);

			// Subscriptions
			this.show();
		},
		show: function () {
			var _this = this;
			this.$container.fadeIn(400, function () {
				this.statFast();
				socket.once('getStatConveyer', function (data) {
					if (!data || data.error) {
						window.noty({text: data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
					} else {
						data = data.data;
						var i = 0,
							timeZoneOffset = -((new Date()).getTimezoneOffset()) * 60000,
							stampLocal;
						while (++i < data.length) {
							stampLocal = data[i].stamp + timeZoneOffset;
							this.conveyerLengthData.push(
								[stampLocal, data[i].clength]
							);
							this.conveyerConvertData.push(
								[stampLocal, data[i].converted]
							);
						}
						this.conveyerLengthChart = new Highcharts.StockChart(_.assign({
							chart: {
								renderTo: 'conveyerLengthGraph'
							},
							series: [
								{
									name: 'Фотографий в очереди',
									data: this.conveyerLengthData,
									tooltip: {
										valueDecimals: 0
									}
								}
							]
						}, this.chartsOptions));
						this.conveyerConvertChart = new Highcharts.StockChart(_.assign({
							chart: {
								renderTo: 'conveyerConvertGraph'
							},
							series: [
								{
									name: 'Фотографий конвертированно',
									data: this.conveyerConvertData,
									tooltip: {
										valueDecimals: 0
									}
								}
							]
						}, this.chartsOptions));
					}
				}.bind(this));
				socket.emit('statConveyer', {});


				$.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=aapl-c.json&callback=?', function (data) {
					// Create the chart

				});


			}.bind(this));

			this.showing = true;
		},
		hide: function () {
			this.$container.css('display', '');
			this.showing = false;
		},
		localDestroy: function (destroy) {
			window.clearTimeout(this.timeoutUpdate);
			this.hide();
			destroy.call(this);
		},

		statFast: function () {
			socket.once('takeStatFastConveyer', function (data) {
				if (data) {
					this.clength(data.clength);
					this.cmaxlength(data.cmaxlength);
					this.converted(data.converted);
				}
				this.timeoutUpdate = window.setTimeout(this.statFast.bind(this), 2000);
			}.bind(this));
			socket.emit('giveStatFastConveyer', {});
		}
	});
});