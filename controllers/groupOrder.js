var mongoose = require('mongoose');
var async = require('async');
var Model = require('../models/Order');
var ModelPartner = require('../models/Partner');
var ModelAddress = require('../models/Address');
var _ = require("lodash");
var moment = require("moment");

var populateList = [
    {
        path: 'assignto',
        select: '_id profile.name profile.mobilenumber'
    },
    {
        path: 'client_id',
        select: 'demography externalId'
    },
    {
        path: 'partner_id',
        select: '_id info.name info.acronym info.code'
    },
    {
        path: 'services.service_id',
        select: 'name _id'
    }
]

function grouporders(params, callback){
	var option = {
        page: params.page,
        limit: parseInt(params.limit)
    }
    option.populate = populateList;
    option.columns = 'client_id services partner_id assignto fromtime fromdate status ordertype servicedeliveryaddress servicetime orderGroupId';

    var search = {};

    if(params.orderGroupId)
    {
        search["orderGroupId"] = params.orderGroupId;
    }

    search["status"]={$ne:"Cancelled"}
                
    Model.paginate(search, option, function(error, paginatedResults, pageCount, itemCount) {
        if (error) return next(error);
        var grporderlist = [];
        async.each(paginatedResults, function (ord, nextrow) {
            getById(ord._id, function(err, r) {
                grporderlist.push(r);
                return nextrow();
            });
            
        },function (error) {
            if(error) return next(error);
            return callback(null, {
                response: grporderlist,
                pageCount: pageCount,
                itemCount: itemCount
            })
            // res.json({
            //     response: grporderlist,
            //     pageCount: pageCount,
            //     itemCount: itemCount
            // });
        });
    });
	
}

exports.grouporders = grouporders;

function getById(id, callback) {
    var result;
    
    var getOrder = function(next) {
        var populate = [
            {
                path: 'partner_id',
                select: '_id info.name paymentoptions reportdeliverymode visitcharges areas discounts droppoints sharetubes'
            },
            {
                path: 'services.service_id',
                select: 'name _id code price alias customerinstruction specialinstruction specialinstructions customerinstructions childs postsample postservices sampletype description tubes pendingtubes discountnotapplicable customerinstructiontype masterservice category'                
            },
            {
                path: 'client_id',
                select: '_id externalId demography specialneeds'
            },
            {
                path: 'log.updatedby',
                select: '_id profile.name'
            },
            {
                path: 'statuslog.statusby',
                select: '_id profile.name'
            },
            {
                path: 'assignto',
                select: '_id profile.name'
            },
            {
                path: 'assignby',
                select: '_id profile.name'
            }
        ]

        getOrderById(id, {}, populate, function(e,r) {
            result = r;
            // return next(null); 
            calculateVisitCharge(result.orderGroupId,result.fromdate, result.fromtime, result.partner_id._id, function (e, visitcharge) {            
                if (e) next(null);
                result.paymentdetails.visitingcharges = (visitcharge.fastingVisitsCharge + visitcharge.ppVisitCharge - visitcharge.collectedVisitCharge);
                result.paymentdetails.totalvisitingcharges = visitcharge.fastingVisitsCharge + visitcharge.ppVisitCharge;
                result.paymentdetails.collectedVisitCharge = visitcharge.collectedVisitCharge;
                result.specialneed = result.client_id.specialneeds;
                delete result.client_id.specialneeds;

                return next(null);
            });
            
        });
    }

    var getAddressDetails = function(next){
        var inputParams = {
            partner_id:result.partner_id._id,
            ids:[result.servicedeliveryaddress._id]
        }
        getAddressesByIds(inputParams, function(e,address){
            result.servicedeliveryaddress = address[0];
            return next(null);
        });
    }

    async.waterfall([getOrder, getAddressDetails],function(error) {
        if(error) return callback(error);
        return callback(null, result); 
    });
}

// generic getOrder method
function getOrderById(id, options, populate, callback){
    if(typeof options == "function") {
        callback = options;
        options = null;
    }
    else{
        options = {signature:0, prescriptions:0, schedulenotification:0, todate:0, totime:0};
    }
    if(typeof populate == "function") {
        callback = populate;
        populate = null;
    };
    if(!id) return callback("id missing");
    if(!populate) populate = populateOrder;


    Model.findById(id,options,{lean:true},function (e,r) {
        if(e) return callback(e);

        return callback(null, r);
    }).populate(populate);
}

var calculateVisitCharge = function(group_id, order_date, order_time, partner_id, callback) {
    if (!group_id) return callback("send group id");
    if (!partner_id) return callback("send partner id");
    if (!order_date) return callback("send order_date");
    var params = {
        ordergroupid:   group_id,
        fromdate:       order_date,
        partner_id:         partner_id,
        fromtime:       order_time
    }

    var finalVisitCharge = 0, orders = [], completedOrders = [],groupedOrders=[], partnerVisitChargeList;

    var getOrders = function(next){        
        getOrdersByGroupId(params.ordergroupid, function(e,r){
            if(e) return next(e);
            orders = orders.concat(r);
            // filter orders based on status = SampleCollected || Completed || SampleHandover
            completedOrders = filterOrder(orders);
            groupedOrders = grpOrderByTimeAndAddress(orders);
            return next(null);
        });                
    }

    var getPartner = function(next) {
        getPartnerById(params.partner_id, function(e,p){
            if(e) return next(e);
            partnerVisitChargeList = p.visitcharges;
            return next(null);
        });
    }

    var calVC = function() {
        var charges = calFastingAndPPVisitCharge(groupedOrders, partnerVisitChargeList); //it will return fasting visiting and ppvisiting charge
        charges.collectedVisitCharge = calCompletedVisitCharge(completedOrders);
        charges.totalVisitCharges = charges.fastingVisitsCharge + charges.ppVisitCharge - charges.collectedVisitCharge;
        return charges;
    }

    async.waterfall([getOrders, getPartner], function(err){
        if(err) return callback(err);

        return callback(null, calVC())
    });
};

function getOrdersByGroupId (ordergroupid, callback) {
    var search = {
        orderGroupId: ordergroupid,
        status: {$ne:"Cancelled"}
    };
    Model.find(search,{"servicedeliveryaddress._id": 1, ordertype:1, status:1, fromtime:1, fromdate:1, paymentdetails:1}, 
        {lean:true}, function (error, ords) {
        if(error) return callback("error while finding order by orderGroupId: " + error);
        ords.forEach(function(o){
            o.fromdate = o.fromdate.toISOString();
        });
        return callback(null, ords);
    });                
}

function filterOrder (orders) {
    return _.filter(orders, function (o) {
        return o.status == "SampleCollected" || o.status == "Completed" || o.status == "SampleHandover"
    });
}

function grpOrderByTimeAndAddress(orders) {
    return _.groupBy(orders, function (order) {
        return [order.fromtime, order.servicedeliveryaddress._id, order.fromdate]
    }); 
}

function getPartnerById(id, callback) {
    if(!id) return callback("partner_id missing");

    ModelPartner.findById(id, {paymentdetails:1, visitcharges: 1},{lean:true}, function (error, partner) {
        if(error) return callback(error);

        return callback(null, partner);
    });
}

function calFastingAndPPVisitCharge(grpOrders, prtVC) {
    var result = { fastingVisitsCharge: 0, ppVisitCharge: 0}
    for (var key in grpOrders) {
        var vcObj = getVCByTime(prtVC, grpOrders[key][0].fromdate, grpOrders[key][0].fromtime);
        
        //if order type F visit
        if (_.findIndex(grpOrders[key], function (o) { return o.ordertype == "F" }) > -1) {
            if(vcObj && vcObj.person!=undefined && vcObj.charge!=undefined) result.fastingVisitsCharge = result.fastingVisitsCharge + Math.ceil(grpOrders[key].length/vcObj.person)*vcObj.charge;
        }
        //if order type == PP 
        else if(_.findIndex(grpOrders[key], function (o) { return o.ordertype == "PP" }) > -1){        
            if(vcObj && vcObj.person!=undefined && vcObj.postcharge!=undefined) result.ppVisitCharge = result.ppVisitCharge + Math.ceil(grpOrders[key].length/vcObj.person)*vcObj.postcharge;
        };                
    }
    return result;
}

function getVCByTime(visitcharges, date, time){
    var prtVC = filterVisitChargeByDate(visitcharges, date);
    if(!prtVC) prtVC = [];
    return _.find(prtVC, function (vc) { 
        if(vc.from < vc.to)
            return time >= vc.from && (time <= vc.to || time <= parseInt(vc.to) + 30)
        else
            return (time >= vc.from && time <= 1380) || (time >= 0 && time <= vc.to)
    });
}

function filterVisitChargeByDate(visitcharges, date) {
    var day = moment(date).add("minute",330).format("dddd").toLowerCase();
    return visitcharges.filter(function (v) {
        if (_.findIndex(v.day,function (d) {return d.toLowerCase() == day;})!=-1) {
            return true;
        }
        else return false;
    });
}

function calCompletedVisitCharge(cpldOrders) {
    var collectedVisitCharge = 0;
    // calculating completed visit charge;
    cpldOrders.forEach(function (o) {
        if (o.paymentdetails.visitingcharges)
            collectedVisitCharge = collectedVisitCharge + parseInt(o.paymentdetails.visitingcharges)
    });
    return collectedVisitCharge;
}

var populate = [
    { path:'city_id',select:'name'}
]

var populatePartner = [
    { path:'areas.area_id',select:'_id pincodes name'}
]

function getAddressesByIds(params ,callback){
    if(!params.ids || typeof params.ids != "object") return callback("address ids not found");
    if(!params.ids.length) return callback(null, []);
    var addresses, finalAddress=[], areas;
    
    var getAddresses = function(next) {
        ModelAddress.find({_id:{$in:params.ids}},{},{lean:1}, function (e,a) {
            if(e) return next(e);
            addresses = a;
            return next(null);
        }).populate(populate)
    }



    var getPartnerAreas = function(next){
        ModelPartner.findById(params.partner_id, {"areas.area_id":1}, {lean:true}, function (e,p) {
            if(e) return next(e);
            areas = p.areas;
            return next();
        }).populate(populatePartner)
    }
    
    var getAreaForAddress = function(next){
        addresses.forEach(function(addr){
            delete addr.area_id; //incase area_id come from ui
            function makeObj(area){
                if(area){
                    //delete area.area_id.pincodes;        
                    return _.extend(addr,area);
                }
                else
                    return addr;
            }

            // var addrObj = makeObj(_.find(areas, function(area){
            //     return _.findIndex(area.area_id.pincodes, function(p){ return p == addr.pincode;})>-1 ? true:false;
            // }));
            var addrObj = makeObj(getAreaByPincode(addr.pincode));

            if(addrObj) finalAddress.push(addrObj);

        });
        return next();
    }

    function getAreaByPincode(pincode){
        for (var i = 0; i < areas.length; i++) {            
            if(_.findIndex(areas[i].area_id.pincodes, function(p){ return p == pincode;})>-1) return areas[i];
        }
        return null;
    }

    async.waterfall([getAddresses, getPartnerAreas, getAreaForAddress],function(error){ 
        if(error) callback(error); 
        
        return callback(null, finalAddress);});
}

