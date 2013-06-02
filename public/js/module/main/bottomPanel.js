/*global define:true*/
/**
 * Модель статистики пользователя
 */
define(['underscore', 'Browser', 'Utils', 'socket', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM', 'model/Photo', 'model/User', 'model/storage', 'text!tpl/main/bottomPanel.jade', 'css!style/main/bottomPanel'], function (_, Browser, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, Photo, User, storage, jade) {
	'use strict';
	var cats = [
		{id: 'photos', name: 'Новые фото'},
		{id: 'ratings', name: 'Рейтинги'},
		{id: 'stats', name: 'Статистика'}
	];

	return Cliche.extend({
		jade: jade,
		create: function () {
			this.auth = globalVM.repository['m/common/auth'];
			this.news = ko.observableArray();
			this.cats = ko.observableArray(cats);
			this.catLoading = ko.observable('');
			this.catActive = ko.observable('');

			this.photos = ko.observableArray();
			this.ratings = {
				pbyview: {
					day: ko.observableArray(),
					week: ko.observableArray(),
					all: ko.observableArray(),
					selected: ko.observable('day')
				},
				pbycomm: {
					day: ko.observableArray(),
					week: ko.observableArray(),
					all: ko.observableArray(),
					selected: ko.observable('day')
				},
				ubycomm: {
					day: ko.observableArray(),
					week: ko.observableArray(),
					all: ko.observableArray(),
					selected: ko.observable('day')
				},
				ubyphoto: {
					day: ko.observableArray(),
					week: ko.observableArray(),
					all: ko.observableArray(),
					selected: ko.observable('day')
				}
			};
			this.stats = {
				all: {
					pallCount: 0,
					userCount: 0,
					photoYear: {},
					pdayCount: 0,
					pweekCount: 0
				}
			};

			this.catClickBind = this.catClick.bind(this);

			if (!this.auth.loggedIn()) {
				this.subscriptions.loggedIn = this.auth.loggedIn.subscribe(this.loggedInHandler, this);
			}

			this.getNews();
			this.catJump('photos');
			ko.applyBindings(globalVM, this.$dom[0]);
			this.show();
		},
		show: function () {
			globalVM.func.showContainer(this.$container);
			this.showing = true;
		},
		hide: function () {
			globalVM.func.hideContainer(this.$container);
			this.showing = false;
		},

		loggedInHandler: function () {
			// После логина приверяем если мы можем добавить категории
			this.cats.unshift({id: 'photosToApprove', name: 'Ожидают подтверждения'});
			this.subscriptions.loggedIn.dispose();
			delete this.subscriptions.loggedIn;
		},
		catClick: function (data) {
			this.catJump(data.id);
		},
		catJump: function (id) {
			this.catLoading(id);
			this['get' + Utils.capitalizeFirst(id)](this.catActivate, this);
		},
		catActivate: function (data) {
			this.catActive(this.catLoading());
			this.catLoading('');
		},
		getNews: function (cb, ctx) {
			socket.once('takeIndexNews', function (data) {
				if (!data || data.error || !Array.isArray(data.news)) {
					window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
				} else {
					var i = data.news.length;
					while (i--) {
						data.news.ccount = data.news.ccount || 0;
						if (data.news[i].notice) {
							data.news[i].expand = true;
						} else {
							data.news[i].notice = data.news[i].txt;
						}
					}
					this.news(data.news);
				}

				if (Utils.isType('function', cb)) {
					cb.call(ctx, data);
				}
			}.bind(this));
			socket.emit('giveIndexNews', {limit: 24});
		},
		getPhotos: function (cb, ctx) {
			socket.once('takePhotosNew', function (data) {
				if (this.catLoading() === 'photos') {
					if (!data || data.error || !Array.isArray(data.photos)) {
						window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
					} else {
						this.processPhotos(data.photos, Photo.picFormats.m);
						this.photos(data.photos);
					}

					if (Utils.isType('function', cb)) {
						cb.call(ctx, data);
					}
				}
			}.bind(this));
			socket.emit('givePhotosNew', {limit: 24});
		},
		getRatings: function (cb, ctx) {
			socket.once('takeRatings', function (data) {
				if (this.catLoading() === 'ratings') {
					if (!data || data.error) {
						window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
					} else {
						this.ratings.pbyview.day(this.processPhotos(data.pday, Photo.picFormats.s, 'vdcount', [' просмотр', ' просмотра', ' просмотров']));
						this.ratings.pbyview.week(this.processPhotos(data.pweek, Photo.picFormats.s, 'vwcount', [' просмотр', ' просмотра', ' просмотров']));
						this.ratings.pbyview.all(this.processPhotos(data.pall, Photo.picFormats.s, 'vcount', [' просмотр', ' просмотра', ' просмотров']));

						this.ratings.pbycomm.day(this.processPhotos(data.pcday, Photo.picFormats.s, 'ccount', [' комментарий', ' комментария', ' комментариев']));
						this.ratings.pbycomm.week(this.processPhotos(data.pcweek, Photo.picFormats.s, 'ccount', [' комментарий', ' комментария', ' комментариев']));
						this.ratings.pbycomm.all(this.processPhotos(data.pcall, Photo.picFormats.s, 'ccount', [' комментарий', ' комментария', ' комментариев']));

						this.ratings.ubycomm.day(this.processUsers(data.ucday, 'comments', 'ccount', [' комментарий', ' комментария', ' комментариев']));
						this.ratings.ubycomm.week(this.processUsers(data.ucweek, 'comments', 'ccount', [' комментарий', ' комментария', ' комментариев']));
						this.ratings.ubycomm.all(this.processUsers(data.ucall, 'comments', 'ccount', [' комментарий', ' комментария', ' комментариев']));

						this.ratings.ubyphoto.day(this.processUsers(data.upday, 'photo', 'pcount', [' фотография', ' фотографии', ' фотографий']));
						this.ratings.ubyphoto.week(this.processUsers(data.upweek, 'photo', 'pcount', [' фотография', ' фотографии', ' фотографий']));
						this.ratings.ubyphoto.all(this.processUsers(data.upall, 'photo', 'pcount', [' фотография', ' фотографии', ' фотографий']));
					}

					if (Utils.isType('function', cb)) {
						cb.call(ctx, data);
					}
				}
			}.bind(this));
			socket.emit('giveRatings', {limit: 24});
		},
		ratSelect: function (data, event) {
			var group = $(event.target).parents('.btn-group').attr('id'),
				id = $(event.target).attr('data-time');
			this.ratings[group].selected(id);
		},
		processPhotos: function (photos, picFormat, numField, numFormat) {
			var i = photos.length,
				photo;
			while (i) {
				photo = photos[--i];
				photo.sfile = picFormat + photo.file;
				photo.link = '/p/' + photo.cid;
				if (!photo.title) {
					photo.title = 'Без названия';
				}
				if (numField && numFormat) {
					photo.amount = photo[numField] + Utils.format.wordEndOfNum(photo[numField], numFormat);
				}
			}
			return photos;
		},
		processUsers: function (users, linkSection, numField, numFormat) {
			var i = users.length,
				user;
			while (i) {
				user = users[--i];
				if (user.avatar) {
					user.sfile = '/_avatar/d/' + user.avatar;
				} else {
					user.sfile = User.def.full.avatar;
				}
				user.link = '/u/' + user.login + (linkSection ? '/' + linkSection : '');
				user.title = ((user.firstName && (user.firstName + ' ') || '') + (user.lastName || '')) || user.login;
				if (numField && numFormat) {
					user.amount = user[numField] + Utils.format.wordEndOfNum(user[numField], numFormat);
				}
			}
			return users;
		},
		getStats: function (cb, ctx) {
			socket.once('takeStats', function (data) {
				if (this.catLoading() === 'stats') {
					if (!data || data.error || !data.all) {
						window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
					} else {
						this.stats.all = data.all;
					}

					if (Utils.isType('function', cb)) {
						cb.call(ctx, data);
					}
				}
			}.bind(this));
			socket.emit('giveStats', {});
		},
		onThumbLoad: function (data, event) {
			var photoThumb = event.target.parentNode.parentNode;
			photoThumb.style.opacity = 1;
			data = event = photoThumb = null;
		},
		onThumbError: function (data, event) {
			var photoThumb = event.target.parentNode.parentNode;
			event.target.style.visibility = 'hidden';
			photoThumb.classList.add('photoError');
			photoThumb.style.opacity = 1;
			data = event = photoThumb = null;
		}
	});
});