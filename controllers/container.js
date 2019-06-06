var Model = require("../models/Role"),
    mongoose = require("mongoose"),
    mongoosePaginate = require("mongoose-paginate");

exports.count = function(req, res, next) {
    Model.count({},function (err, count) {
        if (err) return res.json("false");
        return res.json("true");
    })
}