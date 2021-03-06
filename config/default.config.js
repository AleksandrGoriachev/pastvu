// Default server configuration
const ms = require('ms');

module.exports = {
    env: 'development', // Enviroment: development, testing, production
    locales: ['en', 'ru'], // List of supported locales. First one is the default locale, if user transferred nothing
    lang: 'ru', // Language: ru, en

    listen: {
        // Accept only this host. If the hostname is omitted,
        // the server will accept connections directed to any IPv4 address (INADDR_ANY)
        hostname: '',
        port: 3000, // Application app.js will listen this port
        uport: 3001, // Application uploader.js will listen this port
        dport: 3002, // Application downloader.js will listen this port
    },

    // Core will listen this
    core: {
        hostname: '',
        port: 3010,
    },

    // Api server will listen this
    api: {
        hostname: '',
        port: 3011,
    },

    // Address for user
    client: {
        protocol: 'http',
        hostname: '127.0.0.1', // Hostname for users, i.e. site entry point
        port: ':3000', // Port for users
    },

    storePath: '', // Store folder with static user content (avatars, photos, etc)
    servePublic: true, // Tell app.js serve out its public folder (js, css, etc)
    serveStore: true, // Tell app.js serve out store public folder

    logPath: './logs', // Folder for logs
    logLongDuration: ms('2s'),
    serveLog: true, // Tell app.js serve out its logs folder (path: "logPath")
    serveLogAuth: {
        user: 'pastvu',
        pass: 'pastvu',
    },

    // Serve out webapi method with http, for mobile clients for example
    serveHTTPApi: true,

    // Compress response data with gzip/deflate.
    // If using nginx before nodejs, recommend to use gzip there and switch off here
    gzip: true,

    // Manual invoke garbage collector in milliseconds
    // WARN: need to use with node flags --nouse-idle-notification --expose-gc
    // If 0 - no manual collect
    manualGarbageCollect: 0,

    mongo: {
        connection: 'mongodb://localhost:27017/pastvu',
        pool: 5, // Number of concurrent connections to DB
        poolDownloader: 2, // Number of concurrent connections to DB of downloader.js
    },
    mongo_api: {
        con: 'mongodb://localhost:27017/pastvu',
        pool: 2,
    },
    redis: {
        host: 'localhost',
        port: '6379',
        retry_unfulfilled_commands: false,
        maxReconnectTime: ms('30s'),
    },

    // Lifetime of link to file of protected photo for user, that has right to see this photo
    protectedFileLinkTTL: ms('30s'),

    // Time to cache photos by browser, that is set as `cache-control: max-age` http header in image response
    // Is needed to understand for how long file url parameter should exist after photo was reconverted to reset cache
    // 0 - no cache
    photoCacheTime: ms('6h'),

    // Connection settings for mail provider. Need to be overrided locally
    mail: {},

    // Default home region for new user
    regionHome: 2,

    sitemapPath: './sitemap', // Folder for generating sitemap
    // Interval between sitemap complete regeneration. First run - next interval after last midnight
    sitemapInterval: ms('12h'),
    sitemapGenerateOnStart: false, // First run must be on server start
};
