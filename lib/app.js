/*
 * Guerilla
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the MIT License.
 *
 * Sets up middleware, routers, and error handlers for the Express.js application.
 */

import utilities from './utilities';

var fs = require('fs-extra');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var express = require('express');
var less = require('less-middleware');
var browserify = require('browserify-middleware');
var config = require('./config');

//setting up app
var app = express();

var lessOptions = {
	dest: path.join(__rootdir, 'public'),
	preprocess: {
		path: function (pathname, req) {
			return pathname.replace(path.sep + 'css' + path.sep, path.sep);
		}
	},
	render: {
		paths: [path.join(__rootdir, 'node_modules', 'bootstrap', 'less')]
	}
}

if (logger.level <= logger.levels.d) {
	app.use(morgan('dev'));
	lessOptions.debug = true;
} 

if (process.env.NODE_ENV !== 'production') 
	lessOptions.force = true;
else 
	lessOptions.once = true;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(favicon(path.join(__rootdir, 'public', 'images', 'favicon.ico')));
app.use('/favicon.ico', function (req, res, next) { res.send(); });
app.use(less(path.join(__rootdir, 'public', 'less'), lessOptions));
app.use(express.static(path.join(__rootdir, 'public')));

//set up web views
app.set('views', path.join(__rootdir, 'views'));
app.set('view engine', 'ejs');

app.use(function (req, res, next) {
	res.locals.jquery = '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';
	res.locals.jqueryui = '//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js';
	res.locals.fontawesome = '//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css';
	res.locals.bootstrapcss = '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css';
	res.locals.bootstrapjs = '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js';
	res.locals.highcharts = '//code.highcharts.com/highcharts.js';
	res.locals.highchartsdata = '//code.highcharts.com/modules/data.js';

	res.locals.changeCase = require('change-case');
	res.locals.moment = require('moment');

	//utils
	res.locals.formatMilliseconds = utilities.formatMilliseconds;
	res.locals.exists = utilities.exists;
	res.locals.stringify = utilities.stringify;

	res.locals.mode = config.getMode();

	next();
});

app.get('/js/common/browserify-bundle.js', browserify(['moment', 'change-case']));

//set up routes
var routes = fs.readdirSync(path.join(__rootdir, 'routes', config.getMode()));
routes.forEach(function (file) {
    if (file !== '.DS_Store')
        app.use('/', require(path.join(__rootdir, 'routes', config.getMode(), file)));
});

//catch 404 and forward to error handler
app.use(function (req, res, next) {
    var error = new Error('Not Found');
    error.status = 404;
    next(error);
});

//error handler
app.use(function (error, req, res, next) {
	if (!res.headersSent) {
		logger.e(error);
		res.status(error.status || 500);
    	res.render('error', { error: error });
	}
});

module.exports = app;