/*global requirejs:true, require:true, define:true*/
/**
 * Модель фотографий пользователя
 */
define(['underscore', 'Browser', 'Utils', 'socket', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM', 'm/Photo', 'm/storage', 'text!tpl/user/comments.jade', 'css!style/user/comments'], function (_, Browser, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, Photo, storage, jade) {
	'use strict';

	return Cliche.extend({
		jade: jade,
		options: {
		},
		create: function () {
			this.auth = globalVM.repository['m/auth'];
			this.u = null;
			this.comments = ko.observableArray();
			this.commentsPhotos = {};
			this.loadingComments = ko.observable(false);

			var user = globalVM.router.params().user || this.auth.iAm.login();
			storage.user(user, function (data) {
				if (data) {
					this.u = data.vm;
					ko.applyBindings(globalVM, this.$dom[0]);
					this.show();
				}
			}, this);
		},
		show: function () {
			this.$container.fadeIn();
			if (this.u.ccount() > 0) {
				this.getPage(1);
			}
			this.showing = true;
		},
		hide: function () {
			this.$container.css('display', '');
			this.showing = false;
		},

		getPage: function (page, cb, ctx) {
			this.loadingComments(true);
			socket.once('takeCommentsUser', function (data) {
				var photo,
					comment,
					i;
				if (!data || data.error || !Array.isArray(data.comments)) {
					window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
				} else {
					for (i in data.photos) {
						if (data.photos[i] !== undefined) {
							photo = data.photos[i];
							photo.sfile = Photo.picFormats.micro + photo.file;
							photo.link = '/p/' + photo.cid;
							photo.time = '(' + photo.year + (photo.year2 && photo.year2 !== photo.year ? '-' + photo.year2 : '') + ')';
							photo.name = photo.title + ' <span class="photoYear">' + photo.time + '</span>' ;
						}
					}
					this.commentsPhotos = data.photos;

					i = data.comments.length;
					while (i) {
						comment = data.comments[--i];
						comment.link = this.commentsPhotos[comment.photo].link + '?hl=comment-' + comment.cid;
					}
					this.comments(data.comments);
				}
				if (Utils.isType('function', cb)) {
					cb.call(ctx, data);
				}
				this.loadingComments(false);
			}.bind(this));
			socket.emit('giveCommentsUser', {login: this.u.login(), page: page});
		},

		onThumbLoad: function (data, event) {
			$(event.target).parents('.photoThumb').animate({opacity: 1});
			data = event = null;
		},
		onThumbError: function (data, event) {
			var $parent = $(event.target).parents('.photoThumb');
			event.target.style.visibility = 'hidden';
			if (data.conv) {
				$parent.addClass('photoConv');
			} else if (data.convqueue) {
				$parent.addClass('photoConvqueue');
			} else {
				$parent.addClass('photoError');
			}
			$parent.animate({opacity: 1});
			data = event = $parent = null;
		}
	});
});