module.exports.loadController = function (app) {

	// Set custom X-Powered-By for non-static
	app.get('*', function (req, res, next) {
		res.setHeader('X-Powered-By', 'Paul Klimashkin | klimashkin@gmail.com');
		next();
	});

	//ping-pong для проверки работы сервера
	app.get('/ping', function (req, res) {
		res.statusCode = 200;
		res.send('pong');
	});

	// More complicated example: '/p/:cid?/*
	['/', '/p*', '/u*', '/photoUpload', '/news*', '/confirm/:key'].forEach(function (route) {
		app.get(route, appMainHandler);
	});
	function appMainHandler(req, res) {
		res.statusCode = 200;
		res.render('app.jade', {appName: 'Main'});
	}

	['/admin*'].forEach(function (route) {
		app.get(route, appAdminHandler);
	});
	function appAdminHandler(req, res) {
		res.statusCode = 200;
		res.render('app.jade', {appName: 'Admin'});
	}

	//Geocoding for Regions
	app.get('/georegion', function (req, res) {
		console.log(req.route.params[0]);
		res.statusCode = 200;
		res.render('diff/georegion.jade', {});
	});
};