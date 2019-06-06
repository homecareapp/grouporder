	var express = require('express');
	var router = express.Router();
	// var userController = require('../controllers/user');
	var container = require('../controllers/container.js');
	
	/* GET home page. */
	router.get('/', function(req, res, next) {
	    res.send('index.html');
	});

	// router.post('/login', userController.postLogin);
	router.get('/checkGroupOrderContainer', container.count);
	
	module.exports = router;
