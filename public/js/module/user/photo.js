/*global requirejs:true, require:true, define:true*/
/**
 * Модель фотографий пользователя
 */
define(['underscore', 'Browser', 'Utils', 'socket', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM', 'renderer', 'm/User', 'm/Users', 'text!tpl/user/photo.jade', 'css!style/user/photo'], function (_, Browser, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, renderer, User, users, jade) {
    'use strict';
    var $window = $(window);
    ko.observableArray['fn']['concat'] = function (arr, before) {
        var underlyingArray = this(),
            methodCallResult;

        this.valueWillMutate();
        methodCallResult = Array.prototype[(before ? 'unshift' : 'push')][(Array.isArray(arr) ? 'apply' : 'call')](underlyingArray, arr);
        this.valueHasMutated();

        return methodCallResult;
    };

    return Cliche.extend({
        jade: jade,
        options: {
            canAdd: false
        },
        create: function () {
            this.auth = globalVM.repository['m/auth'];
            this.u = null;
            this.photos = ko.observableArray();
            this.uploadVM = null;
            this.limit = 42; //Стараемся подобрать кол-во, чтобы выводилось по-строчного. Самое популярное - 6 на строку
            this.loadingPhoto = ko.observable(false);
            this.scrollActive = false;
            this.scrollHandler = function () {
                if ($window.scrollTop() >= $(document).height() - $window.height() - 50) {
                    this.getNextPage();
                }
            }.bind(this);
            this.width = ko.observable('0px');
            this.height = ko.observable('0px');
            P.window.square.subscribe(this.marginCalc, this);

            var user = globalVM.router.params().user || this.auth.iAm.login();

            users.user(user, function (vm) {
                if (vm) {
                    this.u = vm;
                    this.canAdd = ko.observable(this.options.canAdd && this.u.login() === this.auth.iAm.login());
                    ko.applyBindings(globalVM, this.$dom[0]);
                    this.show();
                }
            }, this);
        },
        show: function () {
            this.$container.fadeIn(function () {
                //this.marginCalc(P.window.square());
            }.bind(this));
            this.marginCalc(P.window.square());
            if (this.u.pcount() > 0) {
                this.getPage(0, this.canAdd() ? this.limit - 1 : this.limit);
                $window.on('scroll', this.scrollHandler);
                this.scrollActive = true;
            }
            this.showing = true;
        },
        hide: function () {
            if (this.scrollActive) {
                $window.off('scroll', this.scrollHandler);
                this.scrollActive = false;
            }
            this.$container.css('display', '');
            this.showing = false;
        },
        getPhotos: function (start, limit, cb, ctx) {
            socket.once('takeUserPhoto', function (data) {
                data.forEach(function (item, index, array) {
                    item.pfile = '/_photo/thumb/' + item.file;
                    item.conv = item.conv || false;
                    item.convqueue = item.convqueue || false;
                });
                if (Utils.isObjectType('function', cb)) {
                    cb.call(ctx, data);
                }
                this.loadingPhoto(false);
            }.bind(this));
            socket.emit('giveUserPhoto', {login: this.u.login(), start: start, limit: limit});
            this.loadingPhoto(true);
        },
        getPage: function (start, limit) {
            this.getPhotos(start, limit, function (data) {
                this.photos.concat(data, false);
                if (this.scrollActive && this.photos().length >= this.u.pcount()) {
                    $window.off('scroll', this.scrollHandler);
                    this.scrollActive = false;
                }
            }, this);
        },
        getNextPage: function () {
            if (!this.loadingPhoto()) {
                this.getPage(this.photos().length, this.limit);
            }
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
        },
        marginCalc: function (v) {
            var windowW = P.window.w(),
                domW = this.$dom.width() - 1, //this.$container.width()
                thumbW,
                thumbH,
                thumbN,
                thumbWMin = 120,
                thumbWMax = 246,
                marginMin;


            if (windowW < 1000) {
                thumbN = 4;
                marginMin = 8;
            } else if (windowW < 1366) {
                thumbN = 5;
                marginMin = 10;
            } else {
                thumbN = 6;
                marginMin = 12;
            }
            thumbW = Math.max(thumbWMin, Math.min(domW / thumbN - marginMin - 2, thumbWMax));
            thumbH = thumbW / 1.5 >> 0;
            thumbW = thumbH * 1.5;

            //margin = ((domW % thumbW) / (domW / thumbW >> 0)) / 2 >> 0;

            this.width(thumbW + 'px');
            this.height(thumbH + 'px');

            console.log(windowW, domW, thumbW, thumbH);
            windowW = domW = thumbW = thumbH = null;
        },
        showUpload: function (data, event) {
            this.$dom.find('span.modalCaption').text('Upload photo');
            $('.photoUploadCurtain').fadeIn(400, function () {
                renderer(this, [
                    {module: 'm/user/photoUpload', container: '.modalContainer', options: {popup: true}, callback: function (vm) {
                        this.uploadVM = vm;
                    }.bind(this)}
                ], this.level + 1);
            }.bind(this));
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            return false;
        },
        closeUpload: function (data, event) {
            $('.photoUploadCurtain').fadeOut(400, function () {
                this.uploadVM.destroy();
                var oldFirst = this.photos()[0] ? this.photos()[0].file : 0;
                this.getPhotos(0, 11, function (data) {
                    if (oldFirst === 0) {
                        this.photos.concat(data, false);
                    } else {
                        var intersectionIndex = data.reduce(function (previousValue, currentValue, index, array) {
                            if (previousValue === 0 && currentValue.file === oldFirst) {
                                return index;
                            } else {
                                return previousValue;
                            }
                        }.bind(this), 0);
                        if (intersectionIndex > 0) {
                            this.photos.concat(data.slice(0, intersectionIndex), true);
                        }
                    }

                }, this);
            }.bind(this));
        }
    });
});