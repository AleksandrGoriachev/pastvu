/*global define:true*/

/**
 * Модель создания/редактирования новости
 */
define([
	'underscore', 'jquery', 'Utils', 'socket!', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM',
	'leaflet', 'model/storage',
	'text!tpl/admin/region.jade', 'css!style/admin/region', 'css!style/leaflet'
], function (_, $, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, L, storage, jade) {
	'use strict';

	var regionDef = {
		cid: 0,
		parent: undefined,
		geo: '',
		level: 0,
		title_en: '',
		title_local: ''
	};

	return Cliche.extend({
		jade: jade,
		create: function () {
			this.destroy = _.wrap(this.destroy, this.localDestroy);
			this.auth = globalVM.repository['m/common/auth'];
			this.createMode = ko.observable(true);

			this.region = ko_mapping.fromJS(regionDef);
			this.geoStringOrigin = null;
			this.geoObj = null;

			this.map = null;
			this.layerSaved = null;
			this.layerCurr = null;

			this.subscriptions.route = globalVM.router.routeChanged.subscribe(this.routeHandler, this);
			this.routeHandler();

			ko.applyBindings(globalVM, this.$dom[0]);
			this.show();
		},
		show: function (cb, ctx) {
			globalVM.func.showContainer(this.$container);
			this.showing = true;
		},
		hide: function () {
			globalVM.func.hideContainer(this.$container);
			this.showing = false;
		},
		localDestroy: function (destroy) {
			this.map.remove();
			delete this.map;

			this.hide();
			destroy.call(this);
		},
		createMap: function () {
			if (this.map) {
				return;
			}
			var options = {center: [36, -25], zoom: 2, minZoom: 2, maxZoom: 15, trackResize: true};

			if (this.layerSaved) {
				options.center = this.layerSaved.getBounds().getCenter();
			}

			this.map = new L.map(this.$dom.find('.map')[0], options);
			L.tileLayer('http://{s}.tile.osmosnimki.ru/kosmo/{z}/{x}/{y}.png', {
				maxZoom: 16
			}).addTo(this.map);
		},
		routeHandler: function () {
			var cid = globalVM.router.params().cid;

			if (cid === 'create') {
				this.createMode(true);
				this.resetData();
				this.createMap();
			} else {
				cid = Number(cid);
				if (!cid) {
					return globalVM.router.navigateToUrl('/admin/region');
				}
				this.createMode(false);
				this.getOneRegion(cid, function (data, error) {
					if (!error) {
						this.drawData();
					}
				}, this);
			}
		},
		resetData: function () {
			if (this.layerSaved) {
				this.map.removeLayer(this.layerSaved);
			}
			ko_mapping.fromJS(regionDef, this.region);
		},
		drawData: function () {
			if (this.layerSaved) {
				this.map.removeLayer(this.layerSaved);
			}
			this.layerSaved = L.geoJson(this.geoObj, {
				style: {
					"color": "#F00",
					"weight": 3,
					"opacity": 0.6
				}
			});

			if (!this.map) {
				this.createMap();
			}
			this.map.fitBounds(this.layerSaved.getBounds());
			this.layerSaved.addTo(this.map);
		},
		fillData: function (region) {
			ko_mapping.fromJS(region, this.region);

			if (region.geo) {
				this.geoStringOrigin = region.geo;
				try {
					this.geoObj = JSON.parse(region.geo);
				} catch (err) {
					window.noty({text: 'GeoJSON client parse error!', type: 'error', layout: 'center', timeout: 3000, force: true});
					this.geoStringOrigin = null;
					this.geoObj = null;
					return false;
				}
			}
			return true;
		},
		getOneRegion: function (cid, cb, ctx) {
			socket.once('takeRegion', function (data) {
				var error = !data || !!data.error || !data.region;

				if (error) {
					window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 4000, force: true});
				} else {
					error = !this.fillData(data.region);
				}

				if (Utils.isType('function', cb)) {
					cb.call(ctx, data, error);
				}
			}.bind(this));
			socket.emit('giveRegion', {cid: cid});
		},
		save: function () {
			var saveData = ko_mapping.toJS(this.region);

			if (!saveData.geo) {
				window.noty({text: 'GeoJSON обязателен!', type: 'error', layout: 'center', timeout: 2000, force: true});
				return false;
			}
			if (saveData.geo === this.geoStringOrigin) {
				delete saveData.geo;
			}

			if (!saveData.title_en) {
				window.noty({text: 'Нужно заполнить английское название', type: 'error', layout: 'center', timeout: 2000, force: true});
				return false;
			}

			saveData.level = Number(saveData.level);
			if (saveData.level) {
				saveData.parent = Number(saveData.parent);
				if (!saveData.parent) {
					window.noty({text: 'Если уровень региона ниже Страны, необходимо указать номер родительского региона!', type: 'error', layout: 'center', timeout: 5000, force: true});
					return false;
				}
			} else if (saveData.parent !== undefined) {
				delete saveData.parent;
			}

			socket.once('saveRegionResult', function (data) {
				if (!data || data.error || !data.region) {
					window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 4000, force: true});
				} else {
					window.noty({text: 'Сохранено', type: 'success', layout: 'center', timeout: 1800, force: true});

					if (this.createMode()) {
						//Если регион успешно создан, но переходим на его cid, и через роутер он нарисуется
						globalVM.router.navigateToUrl('/admin/region/' + data.region.cid);
					} else if (data.region.geo) {
						//Если отредактирован geojson региона, но заполняем заного его переменные и перерисовываем
						this.fillData(data.region);
						this.drawData();
					}
				}
			}.bind(this));
			socket.emit('saveRegion', saveData);
			return false;
		}
	});
});