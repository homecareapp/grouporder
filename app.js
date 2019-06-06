var express = require('express');
// var favicon = require('serve-favicon');
//var logger = require('morgan');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var cors = require('cors');
// var methodOverride = require('method-override');
var path = require('path');
var mongoose = require('mongoose');
// var multer = require('multer');
var _ = require('lodash');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectDomain = require('connect-domain');
// var messageworker = require('./controllers/messageworker');

var addRequestId = require('express-request-id')();
var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'srlapi', // Required
    streams: [{
        path: './logs/debug.log',
        level: 'debug',
        type: 'rotating-file',
        period: '1d',
        count: 4
    }],
    serializers: {
        user: userLogSerializer
    },
    src: (process.env.NODE_ENV === 'development'), // Optional, see "src" section
});

function userLogSerializer(user) {
    return {
        username: user.username,
        name: user.profile.name,
        role: user.role
    }
}


/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');


var home = require('./routes/home');
var routes = require('./routes/index');
// var api = require('./routes/api');
// var mapi = require('./routes/mapi');

var app = express();
// app.use(favicon(__dirname + '/favicon.ico'));
app.use(cors());

app.use(connectDomain());

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
    console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

// mongoose.set('debug',true);


/**
 * Express configuration.
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use(logger('dev'));

app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
// app.use(multer({
//     dest: path.join(__dirname, 'uploads')
// }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());
// app.use(methodOverride());

app.use(passport.initialize());

global.appRoot = path.resolve(__dirname);

/*init master data*/
// var init = require('./controllers/initmasterdata');
// init.fillData();

app.use(addRequestId);

app.use(function(req, res, next) {
    req.log = logger.child({
        req_id: req.id
    });
    next();
})

/* open access routes */
app.use('/', home);
// app.use('/api', api);
/* authenticated access */
app.use(passportConf.isAuthenticated);
// app.use('/mapi', mapi);

app.use(function(req, res, next) {
    req.log.debug({ user: req.user, body: req.body, url: req.originalUrl }, 'request');
    next();
});

app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {

        req.log.error({ err: err, stack: err.stack }, err.message);
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err,
            stack: err.stack
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    req.log.error({ err: err, stack: err.stack }, err.message);
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

//start message queue and start workers
// messageworker.startworkers();
module.exports = app;
