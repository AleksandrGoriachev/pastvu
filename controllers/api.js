'use strict';

var photoController = require('./photo.js');

var getPhotoRequest = (function () {
	var noselect = {frags: 0, album: 0, adate: 0, sdate: 0};
	return function (req, res) {
		var cid = Number(req.params.cid);
		if (!cid) {
			return res.send(404, 'Not found');
		}
		photoController.core.givePhoto(null, {cid: cid, noselect: noselect}, function (err, photo) {
			if (err) {
				return res.send(500, 'Error ocured');
			}
			if (photo.ldate) {
				photo.ldate = photo.ldate.getTime();
			}
			res.json(200, photo);
		});
	};
}());

module.exports.getPhotoRequest = getPhotoRequest;