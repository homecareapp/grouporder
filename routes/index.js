var express = require('express');
var router = express.Router();
var passportConf = require('../config/passport');
var order = require('../controllers/groupOrder');


router.get('/grouporders', passportConf.isAuthorized, function(req,res,next){
    var params = req.query;
    

	
	order.grouporders(params, function(e, r){
		if(e) return next(e);
		return res.json(r);
	});
});

module.exports = router;