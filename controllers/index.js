var auth = require('./auth.js'),
    Settings,
    User,
    Step = require('step'),
    log4js = require('log4js');

module.exports.loadController = function (app, db, io) {
    var logger = log4js.getLogger("index.js");

    Settings = db.model('Settings');
    User = db.model('User');

    app.dynamicHelpers({
        checkAccess: function (req, res) {
            return function (role) {
                var user = req.session.user;
                return User.checkRole(user, role);
            }
        }
    });

    function regenSession(req, res, next) {
        if (req.session.login) {
            var neoStore = req.session.neoStore || {};
            var login = req.session.login,
                remember = req.session.remember,
                message = req.session.message;
            //console.log('qqqq1=' + req.sessionID+' '+req.session.login);
            req.session.regenerate(function (err) {
                if (err) logger.error('Regenerate session error: ' + err);
                req.session.login = login;
                req.session.remember = remember;
                req.session.message = message;
                if (remember) req.session.cookie.expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                else req.session.cookie.expires = false;
                req.session.save();
                //console.log('qqqq2=' + req.sessionID+' '+req.session.login);
                next();
            });
        } else {
            next();
        }
    }

    app.get('/'/*, regenSession*/, function (req, res) {
        res.render('index.jade', {pretty: false, pageTitle: 'OldMos2', appHash: app.hash});
    });

    app.get('/updateCookie', function (req, res) {
        res.send('updateCookie', 200);
    });

    io.sockets.on('connection', function (socket) {
        var hs = socket.handshake,
            session = hs.session;
        //session.message = 'Thank you! Your registration is confirmed. Now you can enter using your username and password';
        if (session.message) {
            socket.emit('initMessage', {init_message: session.message});
            session.message = null;
        }

        socket.on('giveGlobeParams', function (data) {
            var params = {
                LoggedIn: !!session.login,
                ip: hs.address
            };
            Step(
                function () {
                    Settings.find({}, this.parallel());
                    if (params.LoggedIn) User.findOne({'login': session.login}).select({ 'pass': 0, 'salt': 0, 'roles': 0}).exec(this.parallel());
                },
                function (err, settings, user) {
                    var x = settings.length - 1;
                    do {
                        params[settings[x]['key']] = settings[x]['val']
                    } while (x--);
                    params.user = user;
                    this();
                },
                function () {
                    socket.emit('takeGlobeParams', params.extend({appHash: app.hash}));
                }
            );
        });
    });


};